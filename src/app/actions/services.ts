'use server';

/**
 * Barangay Services Server Actions (Schema: barangay)
 */

import { query, queryOne } from '../../lib/db';
import { requireRole } from './auth';
import { ServiceItem } from '../../types/barangay';

/**
 * Fetch all active services for public display and citizen applications
 */
export async function getActiveServices(): Promise<ServiceItem[]> {
  try {
    return await query<ServiceItem>(
      `SELECT id, name, description, category, fee, processing_days, 
              requirements, requires_appointment, is_active, created_at
       FROM barangay.services
       WHERE is_active = true
       ORDER BY category ASC, name ASC`
    );
  } catch (error) {
    console.error('[services.getActiveServices error]', error);
    return [];
  }
}

/**
 * Fetch all services (both active and inactive) for admin management
 */
export async function getAllServices(): Promise<ServiceItem[]> {
  await requireRole(['staff', 'admin', 'super_admin']);
  return await query<ServiceItem>(
    `SELECT id, name, description, category, fee, processing_days, 
            requirements, requires_appointment, is_active, created_at, updated_at
     FROM barangay.services
     ORDER BY category ASC, name ASC`
  );
}

/**
 * Fetch single service details
 */
export async function getServiceById(serviceId: string): Promise<ServiceItem | null> {
  return await queryOne<ServiceItem>(
    `SELECT id, name, description, category, fee, processing_days, 
            requirements, requires_appointment, is_active
     FROM barangay.services
     WHERE id = $1`,
    [serviceId]
  );
}

/**
 * Create a new service (Admin only)
 */
export async function createService(data: {
  name: string;
  description: string;
  category: string;
  fee: number;
  processingDays: number;
  requirements: any[];
  requiresAppointment?: boolean;
}): Promise<{ success: boolean; serviceId?: string; error?: string }> {
  try {
    const session = await requireRole(['admin', 'super_admin']);

    const row = await queryOne<{ id: string }>(
      `INSERT INTO barangay.services (
        name, description, category, fee, processing_days,
        requirements, requires_appointment, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING id`,
      [
        data.name.trim(),
        data.description.trim(),
        data.category.trim(),
        data.fee,
        data.processingDays,
        JSON.stringify(data.requirements),
        data.requiresAppointment ?? false,
      ]
    );

    if (row) {
      await query(
        `INSERT INTO barangay.audit_logs (user_id, action, entity_type, entity_id, new_values)
         VALUES ($1, 'CREATE_SERVICE', 'services', $2, $3)`,
        [session.userId, row.id, JSON.stringify(data)]
      );
    }

    return { success: true, serviceId: row?.id };
  } catch (err: any) {
    console.error('[services.createService error]', err);
    return { success: false, error: err?.message || 'Failed to create service.' };
  }
}

/**
 * Update an existing service (Admin only)
 */
export async function updateService(
  serviceId: string,
  data: Partial<{
    name: string;
    description: string;
    category: string;
    fee: number;
    processingDays: number;
    requirements: any[];
    requiresAppointment: boolean;
    isActive: boolean;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireRole(['admin', 'super_admin']);

    const current = await queryOne<ServiceItem>(
      `SELECT * FROM barangay.services WHERE id = $1`,
      [serviceId]
    );

    if (!current) {
      return { success: false, error: 'Service not found.' };
    }

    await query(
      `UPDATE barangay.services
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           fee = COALESCE($4, fee),
           processing_days = COALESCE($5, processing_days),
           requirements = COALESCE($6, requirements),
           requires_appointment = COALESCE($7, requires_appointment),
           is_active = COALESCE($8, is_active),
           updated_at = NOW()
       WHERE id = $9`,
      [
        data.name ?? null,
        data.description ?? null,
        data.category ?? null,
        data.fee ?? null,
        data.processingDays ?? null,
        data.requirements ? JSON.stringify(data.requirements) : null,
        data.requiresAppointment ?? null,
        data.isActive ?? null,
        serviceId,
      ]
    );

    await query(
      `INSERT INTO barangay.audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
       VALUES ($1, 'UPDATE_SERVICE', 'services', $2, $3, $4)`,
      [session.userId, serviceId, JSON.stringify(current), JSON.stringify(data)]
    );

    return { success: true };
  } catch (err: any) {
    console.error('[services.updateService error]', err);
    return { success: false, error: err?.message || 'Failed to update service.' };
  }
}
