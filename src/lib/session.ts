/**
 * Session management engine using `jose` JWTs
 * Provides universal cookie storage (compatible with Next.js Server Actions and Vite Client)
 */

import { SignJWT, jwtVerify } from 'jose';
import 'server-only';
import { cookies } from 'next/headers';
import { SessionPayload, UserRoleName } from '../types/barangay';

export const SESSION_COOKIE_NAME = 'barangay_session_token';
const DEFAULT_EXPIRATION_TIME = '7d';
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set to at least 32 characters.');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Sign a new session JWT payload
 */
export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(DEFAULT_EXPIRATION_TIME)
    .sign(getSecretKey());
}

/**
 * Decrypt and verify a session JWT token
 */
export async function decryptSession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
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
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
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
    const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
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
    (await cookies()).delete(SESSION_COOKIE_NAME);
  } catch (err) {
    console.error('[session] Error deleting session cookie:', err);
  }
}
