/**
 * Session management engine using `jose` JWTs
 * Provides universal cookie storage (compatible with Next.js Server Actions and Vite Client)
 */

import { SignJWT, jwtVerify } from 'jose';
import { SessionPayload, UserRoleName } from '../types/barangay';

export const SESSION_COOKIE_NAME = 'barangay_session_token';
const DEFAULT_EXPIRATION_TIME = '7d';
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Encode symmetric signing key
const secretKey = new TextEncoder().encode(
  (typeof process !== 'undefined' && process.env?.SESSION_SECRET) ||
  'camohaguin-barangay-jwt-secure-secret-key-32-chars-min!!'
);

/**
 * Universal Cookie Storage Helper
 * Adapts to browser document.cookie and server environments without requiring next/headers
 */
class UniversalCookieStore {
  private inMemory: Map<string, string> = new Map();

  get(name: string): { name: string; value: string } | undefined {
    if (typeof document !== 'undefined') {
      const match = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${encodeURIComponent(name)}=`));
      if (match) {
        return { name, value: decodeURIComponent(match.split('=')[1]) };
      }
    }
    const val = this.inMemory.get(name);
    return val ? { name, value: val } : undefined;
  }

  set(
    name: string,
    value: string,
    options?: { maxAge?: number; path?: string; secure?: boolean; httpOnly?: boolean; sameSite?: string }
  ): void {
    this.inMemory.set(name, value);
    if (typeof document !== 'undefined') {
      let cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
      if (options?.maxAge) cookieStr += `; max-age=${options.maxAge}`;
      cookieStr += `; path=${options?.path || '/'}`;
      if (options?.secure) cookieStr += '; secure';
      if (options?.sameSite) cookieStr += `; samesite=${options.sameSite}`;
      document.cookie = cookieStr;
    }
  }

  delete(name: string): void {
    this.inMemory.delete(name);
    if (typeof document !== 'undefined') {
      document.cookie = `${encodeURIComponent(name)}=; max-age=0; path=/`;
    }
  }
}

const cookieStoreInstance = new UniversalCookieStore();

export async function cookies(): Promise<UniversalCookieStore> {
  return cookieStoreInstance;
}

/**
 * Sign a new session JWT payload
 */
export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(DEFAULT_EXPIRATION_TIME)
    .sign(secretKey);
}

/**
 * Decrypt and verify a session JWT token
 */
export async function decryptSession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    if (!payload.userId || !payload.role || !payload.email) {
      return null;
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as UserRoleName,
      residentId: (payload.residentId as string) || null,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Store the signed JWT inside a cookie
 */
export async function createSessionCookie(payload: SessionPayload): Promise<string> {
  const token = await encryptSession(payload);
  const store = await cookies();

  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: false, // Accessible in browser client
    secure: typeof process !== 'undefined' && process.env?.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE_SECONDS,
    path: '/',
  });

  return token;
}

/**
 * Retrieve and decrypt current session from cookie
 */
export async function getSessionFromCookie(): Promise<SessionPayload | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await decryptSession(token);
  } catch {
    return null;
  }
}

/**
 * Remove session cookie to log out
 */
export async function deleteSessionCookie(): Promise<void> {
  try {
    const store = await cookies();
    store.delete(SESSION_COOKIE_NAME);
  } catch (err) {
    console.error('[session] Error deleting session cookie:', err);
  }
}
