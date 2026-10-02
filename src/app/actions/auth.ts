'use server';

/**
 * Authentication Server Actions (Schema: barangay)
 */

import bcrypt from 'bcryptjs';
import { query, queryOne, withTransaction } from '../../lib/db';
import {
  createSessionCookie,
  deleteSessionCookie,
  getSessionFromCookie,
} from '../../lib/session';
import {
  Resident,
  SessionPayload,
  UserAccount,
  UserRoleName,
} from '../../types/barangay';

export interface AuthActionResult<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface RegisterResidentInput {
  residentId: string;
  email: string;
  password: string;
}

/**
 * Log in a user with email and password
 */
export async function login(
  emailInput: string,
  passwordInput: string
): Promise<AuthActionResult<{ user: SessionPayload }>> {
  const email = emailInput.trim().toLowerCase();

  try {
    // 1. Fetch user by email
    const user = await queryOne<UserAccount>(
      `SELECT id, role_id, resident_id, email, password_hash, is_active, 
              failed_login_attempts, locked_until
       FROM barangay.users
       WHERE LOWER(email) = $1`,
      [email]
    );

    if (!user) {
      return { success: false, error: 'Invalid email address or password.' };
    }

    // 2. Check if user is active
    if (!user.is_active) {
      return {
        success: false,
        error: 'Your account has been deactivated. Please contact the Barangay Hall.',
      };
    }

    // 3. Check if account is currently locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesRemaining = Math.ceil(
        (new Date(user.locked_until).getTime() - Date.now()) / (1000 * 60)
      );
      return {
        success: false,
        error: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${minutesRemaining} minute(s).`,
      };
    }

    // 4. Verify password with bcryptjs
    const isValid = await bcrypt.compare(passwordInput, user.password_hash);

    if (!isValid) {
      const updatedAttempts = (user.failed_login_attempts || 0) + 1;
      const MAX_FAILED_ATTEMPTS = 5;

      if (updatedAttempts >= MAX_FAILED_ATTEMPTS) {
        // Lock for 15 minutes
        await query(
          `UPDATE barangay.users 
           SET failed_login_attempts = $1, 
               locked_until = NOW() + INTERVAL '15 minutes'
           WHERE id = $2`,
          [updatedAttempts, user.id]
        );
        return {
          success: false,
          error: 'Too many failed login attempts. Your account has been locked for 15 minutes.',
        };
      } else {
        await query(
          `UPDATE barangay.users 
           SET failed_login_attempts = $1 
           WHERE id = $2`,
          [updatedAttempts, user.id]
        );
        const remaining = MAX_FAILED_ATTEMPTS - updatedAttempts;
        return {
          success: false,
          error: `Invalid email address or password. ${remaining} attempt(s) remaining before lock.`,
        };
      }
    }

    // 5. Reset failed login attempts on success
    await query(
      `UPDATE barangay.users 
       SET failed_login_attempts = 0, locked_until = NULL 
       WHERE id = $1`,
      [user.id]
    );

    // 6. Fetch user role using the DB function barangay.get_user_role()
    const roleRow = await queryOne<{ role_id: number; role_name: string }>(
      `SELECT role_id, role_name FROM barangay.get_user_role($1)`,
      [user.id]
    );

    const roleName = (roleRow?.role_name as UserRoleName) || 'resident';

    // 7. Create Session Cookie
    const sessionPayload: SessionPayload = {
      userId: user.id,
      email: user.email,
      role: roleName,
      residentId: user.resident_id,
    };

    await createSessionCookie(sessionPayload);

    // 8. Log successful login to audit_logs
    await query(
      `INSERT INTO barangay.audit_logs (user_id, action, entity_type, entity_id, new_values)
       VALUES ($1, 'LOGIN_SUCCESS', 'users', $1, $2)`,
      [user.id, JSON.stringify({ email: user.email, role: roleName })]
    );

    return {
      success: true,
      message: 'Login successful.',
      data: { user: sessionPayload },
    };
  } catch (error: any) {
    console.error('[auth.login error]', error);
    return {
      success: false,
      error: 'An unexpected system error occurred during authentication. Please try again.',
    };
  }
}

/**
 * Register a new resident profile and create an authenticated account
 */
export async function registerResident(
  input: RegisterResidentInput
): Promise<AuthActionResult<{ user: SessionPayload; residentId: string }>> {
  const residentId = input.residentId.trim();
  const email = input.email.trim().toLowerCase();

  if (!residentId) {
    return { success: false, error: 'Resident ID is required.' };
  }

  if (!email) {
    return { success: false, error: 'Email address is required.' };
  }

  try {
    return await withTransaction(async (client) => {
      const resident = await client.query(
        `SELECT id, email_address, first_name, last_name
         FROM barangay.residents
         WHERE id = $1`,
        [residentId]
      );

      if (resident.rows.length === 0) {
        return {
          success: false,
          error: 'Resident ID was not found in the barangay resident registry.',
        };
      }

      const residentRecord = resident.rows[0];
      const residentEmail = (residentRecord.email_address || '').trim().toLowerCase();

      if (!residentEmail) {
        return {
          success: false,
          error: 'This resident profile does not have an email address on file. Please update the resident record first.',
        };
      }

      if (residentEmail !== email) {
        return {
          success: false,
          error: 'The email you entered does not match the email recorded for this resident profile.',
        };
      }

      const existingUser = await client.query(
        `SELECT id FROM barangay.users WHERE LOWER(email) = $1 OR resident_id = $2`,
        [email, residentId]
      );
      if (existingUser.rows.length > 0) {
        return {
          success: false,
          error: 'An account already exists for this resident ID or email address.',
        };
      }

      const roleRow = await client.query(
        `SELECT id FROM barangay.roles WHERE name = 'resident'`
      );
      const roleId = roleRow.rows[0]?.id || 1;

      const passwordHash = await bcrypt.hash(input.password, 10);

      const insertUser = await client.query(
        `INSERT INTO barangay.users (
          role_id, resident_id, email, password_hash, is_active
        ) VALUES ($1, $2, $3, $4, true)
        RETURNING id`,
        [roleId, residentId, email, passwordHash]
      );

      const userId = insertUser.rows[0].id;

      const sessionPayload: SessionPayload = {
        userId,
        email,
        role: 'resident',
        residentId,
      };

      await createSessionCookie(sessionPayload);

      await client.query(
        `INSERT INTO barangay.audit_logs (user_id, action, entity_type, entity_id, new_values)
         VALUES ($1, 'USER_REGISTERED', 'users', $1, $2)`,
        [
          userId,
          JSON.stringify({
            email,
            residentId,
            residentName: `${residentRecord.first_name} ${residentRecord.last_name}`,
          }),
        ]
      );

      return {
        success: true,
        message: 'Account created successfully and linked to the resident record.',
        data: { user: sessionPayload, residentId },
      };
    });
  } catch (error: any) {
    console.error('[auth.registerResident error]', error);
    return {
      success: false,
      error: 'Account creation is temporarily unavailable. Please try again later or contact the Barangay Hall.',
    };
  }
}

/**
 * Destroy session cookie
 */
export async function logout(): Promise<AuthActionResult> {
  try {
    const session = await getSessionFromCookie();
    if (session) {
      await query(
        `INSERT INTO barangay.audit_logs (user_id, action, entity_type, entity_id)
         VALUES ($1, 'LOGOUT', 'users', $1)`,
        [session.userId]
      );
    }
    await deleteSessionCookie();
    return { success: true, message: 'Logged out successfully.' };
  } catch (err: any) {
    console.error('[auth.logout error]', err);
    await deleteSessionCookie();
    return { success: true };
  }
}

/**
 * Get current session user profile
 */
export async function getCurrentUser(): Promise<SessionPayload | null> {
  return await getSessionFromCookie();
}

/**
 * Fetch current user including their full Resident profile if available
 */
export async function getCurrentUserProfile(): Promise<{
  session: SessionPayload | null;
  resident: Resident | null;
}> {
  const session = await getSessionFromCookie();
  if (!session) {
    return { session: null, resident: null };
  }

  if (!session.residentId) {
    return { session, resident: null };
  }

  const resident = await queryOne<Resident>(
    `SELECT * FROM barangay.residents WHERE id = $1`,
    [session.residentId]
  );

  return { session, resident };
}

/**
 * Access Guard: Ensure user is logged in
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSessionFromCookie();
  if (!session) {
    throw new Error('Authentication required: Please log in to proceed.');
  }
  return session;
}

/**
 * Access Guard: Ensure user has one of the allowed roles
 */
export async function requireRole(allowedRoles: UserRoleName[]): Promise<SessionPayload> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new Error(`Unauthorized: Role '${session.role}' is not permitted to perform this action.`);
  }
  return session;
}

/**
 * Access Guard: Check permission through barangay.get_role_permissions
 */
export async function requirePermission(permissionName: string): Promise<SessionPayload> {
  const session = await requireAuth();

  const perms = await query<{ permission_name: string }>(
    `SELECT permission_name FROM barangay.get_role_permissions($1)`,
    [session.role]
  );

  const hasPerm = perms.some((p) => p.permission_name === permissionName);
  if (!hasPerm && session.role !== 'super_admin') {
    throw new Error(`Access Denied: Missing required permission '${permissionName}'.`);
  }

  return session;
}
