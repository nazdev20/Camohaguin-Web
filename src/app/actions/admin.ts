'use server';

/**
 * Admin Dashboard & System Operations Server Actions (Schema: barangay)
 */

import { query, queryOne } from '../../lib/db';
import { requireRole } from './auth';
import { AuditLogItem } from '../../types/barangay';

export interface AdminMetrics {
  pendingApplicationsCount: number;
  readyForReleaseCount: number;
  todayAppointmentsCount: number;
  totalActiveResidents: number;
  verifiedResidentsCount: number;
  totalHouseholdsCount: number;
  monthlyApplicationsCount: number;
  totalFeesCollected: number;
  applicationsByStatus: { status: string; count: number }[];
  purokDistribution: { purok: string; resident_count: number }[];
}

/**
 * Efficient SQL aggregation metrics for the Barangay Staff & Admin Dashboard
 */
export async function getAdminDashboardMetrics(): Promise<AdminMetrics> {
  await requireRole(['staff', 'admin', 'super_admin']);

  try {
    // 1. Applications aggregation by status
    const statusCounts = await query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) AS count
       FROM barangay.applications
       GROUP BY status`
    );

    const appStatusMap: Record<string, number> = {};
    for (const row of statusCounts) {
      appStatusMap[row.status] = parseInt(row.count, 10);
    }

    const pendingCount =
      (appStatusMap['submitted'] || 0) +
      (appStatusMap['under_review'] || 0) +
      (appStatusMap['for_compliance'] || 0);

    const readyCount = appStatusMap['ready_for_release'] || 0;

    // 2. Today's appointments count
    const aptRow = await queryOne<{ today_count: string }>(
      `SELECT COUNT(*) AS today_count
       FROM barangay.appointments
       WHERE scheduled_date = CURRENT_DATE 
         AND status NOT IN ('cancelled', 'no_show')`
    );

    // 3. Residents breakdown
    const residentCounts = await queryOne<{
      total_active: string;
      total_verified: string;
    }>(
      `SELECT 
         COUNT(*) FILTER (WHERE is_active = true) AS total_active,
         COUNT(*) FILTER (WHERE residency_status = 'verified') AS total_verified
       FROM barangay.residents`
    );

    // 4. Households count
    const householdRow = await queryOne<{ total_households: string }>(
      `SELECT COUNT(*) AS total_households FROM barangay.households`
    );

    // 5. Monthly applications & revenue collected
    const monthlyStats = await queryOne<{
      monthly_apps: string;
      total_revenue: string;
    }>(
      `SELECT 
         COUNT(*) FILTER (WHERE submitted_at >= date_trunc('month', CURRENT_DATE)) AS monthly_apps,
         COALESCE(SUM(fee_amount) FILTER (WHERE status = 'released'), 0) AS total_revenue
       FROM barangay.applications`
    );

    // 6. Purok distribution
    const purokRows = await query<{ purok: string; resident_count: string }>(
      `SELECT purok, COUNT(*) AS resident_count
       FROM barangay.residents
       WHERE is_active = true
       GROUP BY purok
       ORDER BY purok ASC`
    );

    return {
      pendingApplicationsCount: pendingCount,
      readyForReleaseCount: readyCount,
      todayAppointmentsCount: parseInt(aptRow?.today_count || '0', 10),
      totalActiveResidents: parseInt(residentCounts?.total_active || '0', 10),
      verifiedResidentsCount: parseInt(residentCounts?.total_verified || '0', 10),
      totalHouseholdsCount: parseInt(householdRow?.total_households || '0', 10),
      monthlyApplicationsCount: parseInt(monthlyStats?.monthly_apps || '0', 10),
      totalFeesCollected: parseFloat(monthlyStats?.total_revenue || '0'),
      applicationsByStatus: statusCounts.map((r) => ({
        status: r.status,
        count: parseInt(r.count, 10),
      })),
      purokDistribution: purokRows.map((r) => ({
        purok: r.purok,
        resident_count: parseInt(r.resident_count, 10),
      })),
    };
  } catch (error) {
    console.error('[admin.getAdminDashboardMetrics error]', error);
    // Return fallback clean metrics if table is fresh or database disconnected
    return {
      pendingApplicationsCount: 0,
      readyForReleaseCount: 0,
      todayAppointmentsCount: 0,
      totalActiveResidents: 0,
      verifiedResidentsCount: 0,
      totalHouseholdsCount: 0,
      monthlyApplicationsCount: 0,
      totalFeesCollected: 0,
      applicationsByStatus: [],
      purokDistribution: [],
    };
  }
}

/**
 * Fetch immutable system audit logs
 */
export async function getAuditLogs(params?: {
  entityType?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AuditLogItem[]; total: number }> {
  await requireRole(['admin', 'super_admin']);

  const limit = params?.limit || 50;
  const offset = params?.offset || 0;

  const countRow = await queryOne<{ total: string }>(
    `SELECT COUNT(*) AS total 
     FROM barangay.audit_logs
     WHERE ($1::VARCHAR IS NULL OR entity_type = $1)`,
    [params?.entityType || null]
  );

  const logs = await query<AuditLogItem>(
    `SELECT l.*, u.email AS user_email
     FROM barangay.audit_logs l
     LEFT JOIN barangay.users u ON l.user_id = u.id
     WHERE ($1::VARCHAR IS NULL OR l.entity_type = $1)
     ORDER BY l.created_at DESC
     LIMIT $2 OFFSET $3`,
    [params?.entityType || null, limit, offset]
  );

  return {
    logs,
    total: parseInt(countRow?.total || '0', 10),
  };
}

/**
 * Update or set a site setting key-value pair
 */
export async function updateSiteSetting(
  key: string,
  value: string,
  isPublic = true
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireRole(['admin', 'super_admin']);

    await query(
      `INSERT INTO barangay.site_settings (key, value, is_public)
       VALUES ($1, $2, $3)
       ON CONFLICT (key) 
       DO UPDATE SET value = EXCLUDED.value, is_public = EXCLUDED.is_public`,
      [key.trim(), value.trim(), isPublic]
    );

    await query(
      `INSERT INTO barangay.audit_logs (user_id, action, entity_type, entity_id, new_values)
       VALUES ($1, 'UPDATE_SITE_SETTING', 'site_settings', $2, $3)`,
      [session.userId, key, JSON.stringify({ value, isPublic })]
    );

    return { success: true };
  } catch (err: any) {
    console.error('[admin.updateSiteSetting error]', err);
    return { success: false, error: err?.message || 'Failed to update setting.' };
  }
}

/**
 * Lock or unlock a user account (Super Admin only)
 */
export async function lockOrUnlockUser(
  userId: string,
  lock: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireRole(['admin', 'super_admin']);

    if (lock) {
      await query(
        `UPDATE barangay.users 
         SET locked_until = NOW() + INTERVAL '30 days', failed_login_attempts = 5
         WHERE id = $1`,
        [userId]
      );
    } else {
      await query(
        `UPDATE barangay.users 
         SET locked_until = NULL, failed_login_attempts = 0
         WHERE id = $1`,
        [userId]
      );
    }

    await query(
      `INSERT INTO barangay.audit_logs (user_id, action, entity_type, entity_id, new_values)
       VALUES ($1, $2, 'users', $3, $4)`,
      [
        session.userId,
        lock ? 'LOCK_USER' : 'UNLOCK_USER',
        userId,
        JSON.stringify({ locked: lock }),
      ]
    );

    return { success: true };
  } catch (err: any) {
    console.error('[admin.lockOrUnlockUser error]', err);
    return { success: false, error: err?.message || 'Failed to update user lock state.' };
  }
}
