'use server';

/**
 * Service Applications Server Actions (Schema: barangay)
 */

import { query, queryOne, withTransaction } from '../../lib/db';
import { getCurrentUser, requireRole } from './auth';
import {
  Application,
  ApplicationDocument,
  ApplicationStatus,
  ApplicationStatusHistory,
} from '../../types/barangay';

export interface SubmitApplicationInput {
  serviceId: string;
  purpose: string;
  applicantNotes?: string;
  priority?: 'standard' | 'urgent';
  // If user is guest/walk-in or filing on behalf of a resident
  residentId?: string;
  documents?: {
    documentType: string;
    fileName: string;
    filePath: string;
  }[];
}

export interface ApplicationTrackingResult {
  application: Application | null;
  history: ApplicationStatusHistory[];
  documents: ApplicationDocument[];
}

/**
 * Submit a new service application
 * - Generates tracking number using barangay.generate_tracking_number()
 * - Inserts into barangay.applications
 * - Inserts documents into barangay.application_documents
 * - Inserts initial history status
 * - Notifies staff and writes to audit_logs
 */
export async function submitApplication(
  input: SubmitApplicationInput
): Promise<{ success: boolean; trackingNumber?: string; applicationId?: string; error?: string }> {
  try {
    const currentUser = await getCurrentUser();

    return await withTransaction(async (client) => {
      // 1. Fetch service details & fee
      const serviceRes = await client.query(
        `SELECT id, name, fee, is_active FROM barangay.services WHERE id = $1`,
        [input.serviceId]
      );

      if (serviceRes.rows.length === 0 || !serviceRes.rows[0].is_active) {
        throw new Error('Selected service is inactive or does not exist.');
      }

      const service = serviceRes.rows[0];

      // 2. Generate official tracking number using database function
      const trackingRes = await client.query(
        `SELECT barangay.generate_tracking_number() AS tracking_number`
      );
      const trackingNumber: string = trackingRes.rows[0]?.tracking_number || `BRY-${Date.now()}`;

      // 3. Determine resident_id: either explicitly provided or from session
      const targetResidentId = input.residentId || currentUser?.residentId || null;
      const targetUserId = currentUser?.userId || null;

      // 4. Insert application record
      const appInsert = await client.query(
        `INSERT INTO barangay.applications (
          tracking_number, service_id, resident_id, user_id, purpose,
          applicant_notes, status, priority, fee_amount, submitted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'submitted', $7, $8, NOW())
        RETURNING id`,
        [
          trackingNumber,
          service.id,
          targetResidentId,
          targetUserId,
          input.purpose.trim(),
          input.applicantNotes?.trim() || null,
          input.priority || 'standard',
          service.fee || 0,
        ]
      );

      const applicationId = appInsert.rows[0].id;

      // 5. Insert initial status history
      await client.query(
        `INSERT INTO barangay.application_status_history (
          application_id, from_status, to_status, changed_by, notes, changed_at
        ) VALUES ($1, NULL, 'submitted', $2, 'Application filed online via resident portal.', NOW())`,
        [applicationId, targetUserId]
      );

      // 6. Handle document attachments
      if (input.documents && input.documents.length > 0) {
        for (const doc of input.documents) {
          await client.query(
            `INSERT INTO barangay.application_documents (
              application_id, uploaded_by, document_type, file_name, file_path, is_verified
            ) VALUES ($1, $2, $3, $4, $5, false)`,
            [applicationId, targetUserId, doc.documentType, doc.fileName, doc.filePath]
          );
        }
      }

      // 7. Notify staff/admin users
      const staffUsers = await client.query(
        `SELECT u.id FROM barangay.users u
         JOIN barangay.roles r ON u.role_id = r.id
         WHERE r.name IN ('staff', 'admin', 'super_admin') AND u.is_active = true`
      );

      for (const staff of staffUsers.rows) {
        await client.query(
          `INSERT INTO barangay.notifications (user_id, type, title, body, data, is_read, created_at)
           VALUES ($1, 'NEW_APPLICATION', $2, $3, $4, false, NOW())`,
          [
            staff.id,
            `New Application: ${trackingNumber}`,
            `A new application for ${service.name} has been submitted.`,
            JSON.stringify({ applicationId, trackingNumber, serviceId: service.id }),
          ]
        );
      }

      // 8. Audit log
      await client.query(
        `INSERT INTO barangay.audit_logs (user_id, action, entity_type, entity_id, new_values)
         VALUES ($1, 'SUBMIT_APPLICATION', 'applications', $2, $3)`,
        [
          targetUserId,
          applicationId,
          JSON.stringify({
            trackingNumber,
            serviceName: service.name,
            residentId: targetResidentId,
          }),
        ]
      );

      return {
        success: true,
        trackingNumber,
        applicationId,
      };
    });
  } catch (err: any) {
    console.error('[applications.submitApplication error]', err);
    return {
      success: false,
      error: err?.message || 'Failed to submit service application.',
    };
  }
}

/**
 * Public tracking lookup
 * Returns application status, details, and progression timeline
 */
export async function trackApplication(
  trackingNumberInput: string
): Promise<ApplicationTrackingResult> {
  const trackingNumber = trackingNumberInput.trim().toUpperCase();

  const application = await queryOne<Application>(
    `SELECT a.*, s.name AS service_name, s.category AS service_category,
            r.first_name, r.last_name, r.contact_number, r.email_address, r.purok
     FROM barangay.applications a
     JOIN barangay.services s ON a.service_id = s.id
     LEFT JOIN barangay.residents r ON a.resident_id = r.id
     WHERE UPPER(a.tracking_number) = $1`,
    [trackingNumber]
  );

  if (!application) {
    return { application: null, history: [], documents: [] };
  }

  // Fetch status history timeline
  const history = await query<ApplicationStatusHistory>(
    `SELECT h.*, 
            COALESCE(u.email, 'Barangay Portal') AS changed_by_name
     FROM barangay.application_status_history h
     LEFT JOIN barangay.users u ON h.changed_by = u.id
     WHERE h.application_id = $1
     ORDER BY h.changed_at ASC`,
    [application.id]
  );

  // Fetch uploaded documents
  const documents = await query<ApplicationDocument>(
    `SELECT * FROM barangay.application_documents
     WHERE application_id = $1
     ORDER BY created_at ASC`,
    [application.id]
  );

  return { application, history, documents };
}

/**
 * Update Application Status (Staff & Admin only)
 * - Updates status
 * - Records timestamps for approved_at and released_at
 * - Records audit trail
 * - Notifies applicant in notifications table
 */
export async function updateApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus,
  staffNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireRole(['staff', 'admin', 'super_admin']);

    return await withTransaction(async (client) => {
      // 1. Get current application
      const currentAppRes = await client.query(
        `SELECT a.*, s.name AS service_name 
         FROM barangay.applications a
         JOIN barangay.services s ON a.service_id = s.id
         WHERE a.id = $1`,
        [applicationId]
      );

      if (currentAppRes.rows.length === 0) {
        throw new Error('Application record not found.');
      }

      const currentApp = currentAppRes.rows[0];
      const prevStatus = currentApp.status;

      // 2. Set conditional timestamps
      let approvedAtSql = 'approved_at';
      let releasedAtSql = 'released_at';

      if (newStatus === 'approved' && !currentApp.approved_at) {
        approvedAtSql = 'NOW()';
      }
      if (newStatus === 'released' && !currentApp.released_at) {
        releasedAtSql = 'NOW()';
      }

      // 3. Update application row
      await client.query(
        `UPDATE barangay.applications
         SET status = $1,
             staff_notes = COALESCE($2, staff_notes),
             assigned_to = COALESCE($3, assigned_to),
             approved_at = ${approvedAtSql},
             released_at = ${releasedAtSql}
         WHERE id = $4`,
        [newStatus, staffNotes?.trim() || null, session.userId, applicationId]
      );

      // 4. Insert status history entry
      await client.query(
        `INSERT INTO barangay.application_status_history (
          application_id, from_status, to_status, changed_by, notes, changed_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          applicationId,
          prevStatus,
          newStatus,
          session.userId,
          staffNotes?.trim() || `Status updated to ${newStatus}`,
        ]
      );

      // 5. Notify the applicant if user_id is linked
      if (currentApp.user_id) {
        const title = `Application ${currentApp.tracking_number}: ${newStatus.toUpperCase()}`;
        let body = `Your request for ${currentApp.service_name} status is now "${newStatus.replace(/_/g, ' ')}".`;
        if (newStatus === 'ready_for_release') {
          body += ' You may now claim your document at the Barangay Hall releasing window.';
        } else if (newStatus === 'for_compliance' && staffNotes) {
          body += ` Action required: ${staffNotes}`;
        }

        await client.query(
          `INSERT INTO barangay.notifications (user_id, type, title, body, data, is_read, created_at)
           VALUES ($1, 'APPLICATION_STATUS_UPDATE', $2, $3, $4, false, NOW())`,
          [
            currentApp.user_id,
            title,
            body,
            JSON.stringify({ applicationId, trackingNumber: currentApp.tracking_number, status: newStatus }),
          ]
        );
      }

      // 6. Audit log
      await client.query(
        `INSERT INTO barangay.audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
         VALUES ($1, 'UPDATE_APPLICATION_STATUS', 'applications', $2, $3, $4)`,
        [
          session.userId,
          applicationId,
          JSON.stringify({ from_status: prevStatus }),
          JSON.stringify({ to_status: newStatus, staffNotes }),
        ]
      );

      return { success: true };
    });
  } catch (err: any) {
    console.error('[applications.updateApplicationStatus error]', err);
    return {
      success: false,
      error: err?.message || 'Failed to update application status.',
    };
  }
}

/**
 * Fetch applications belonging to the currently logged in user
 */
export async function getUserApplications(): Promise<Application[]> {
  const session = await getCurrentUser();
  if (!session) return [];

  return await query<Application>(
    `SELECT a.*, s.name AS service_name, s.category AS service_category
     FROM barangay.applications a
     JOIN barangay.services s ON a.service_id = s.id
     WHERE a.user_id = $1 OR (a.resident_id = $2 AND $2 IS NOT NULL)
     ORDER BY a.submitted_at DESC`,
    [session.userId, session.residentId]
  );
}

/**
 * Filtered applications list for Admin/Staff dashboard
 */
export async function getApplicationsList(params?: {
  status?: ApplicationStatus;
  purok?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ applications: Application[]; total: number }> {
  await requireRole(['staff', 'admin', 'super_admin']);

  const conditions: string[] = ['1=1'];
  const values: any[] = [];
  let idx = 1;

  if (params?.status) {
    conditions.push(`a.status = $${idx++}`);
    values.push(params.status);
  }

  if (params?.purok) {
    conditions.push(`r.purok = $${idx++}`);
    values.push(params.purok);
  }

  if (params?.search) {
    conditions.push(
      `(a.tracking_number ILIKE $${idx} OR r.first_name ILIKE $${idx} OR r.last_name ILIKE $${idx} OR s.name ILIKE $${idx})`
    );
    values.push(`%${params.search}%`);
    idx++;
  }

  const whereClause = conditions.join(' AND ');

  const countRow = await queryOne<{ total: string }>(
    `SELECT COUNT(*) AS total
     FROM barangay.applications a
     JOIN barangay.services s ON a.service_id = s.id
     LEFT JOIN barangay.residents r ON a.resident_id = r.id
     WHERE ${whereClause}`,
    values
  );

  const limit = params?.limit || 50;
  const offset = params?.offset || 0;

  const applications = await query<Application>(
    `SELECT a.*, s.name AS service_name, s.category AS service_category,
            r.first_name, r.last_name, r.purok, r.contact_number
     FROM barangay.applications a
     JOIN barangay.services s ON a.service_id = s.id
     LEFT JOIN barangay.residents r ON a.resident_id = r.id
     WHERE ${whereClause}
     ORDER BY a.submitted_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...values, limit, offset]
  );

  return {
    applications,
    total: parseInt(countRow?.total || '0', 10),
  };
}
