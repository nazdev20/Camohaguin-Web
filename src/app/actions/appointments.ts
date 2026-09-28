'use server';

/**
 * Appointments Server Actions (Schema: barangay)
 */

import { query, queryOne, withTransaction } from '../../lib/db';
import { getCurrentUser, requireAuth, requireRole } from './auth';
import { AppointmentItem } from '../../types/barangay';

// Configurable daily time slots for barangay hall frontline desks
export const STANDARD_TIME_SLOTS = [
  '08:30 - 09:30',
  '09:30 - 10:30',
  '10:30 - 11:30',
  '13:00 - 14:00',
  '14:00 - 15:00',
  '15:00 - 16:00',
];

export const MAX_APPOINTMENTS_PER_SLOT = 3;

export interface SlotAvailability {
  timeSlot: string;
  maxCapacity: number;
  bookedCount: number;
  isAvailable: boolean;
}

/**
 * Check slot availability for a given date and service to prevent double-booking
 */
export async function getAvailableSlots(
  serviceId: string,
  dateStr: string // YYYY-MM-DD
): Promise<SlotAvailability[]> {
  try {
    // 1. Fetch currently booked appointments for this date
    const bookedRows = await query<{ time_slot: string; count: string }>(
      `SELECT time_slot, COUNT(*) as count
       FROM barangay.appointments
       WHERE scheduled_date = $1 
         AND service_id = $2
         AND status NOT IN ('cancelled', 'no_show')
       GROUP BY time_slot`,
      [dateStr, serviceId]
    );

    const bookingMap: Record<string, number> = {};
    for (const row of bookedRows) {
      bookingMap[row.time_slot] = parseInt(row.count, 10);
    }

    return STANDARD_TIME_SLOTS.map((slot) => {
      const booked = bookingMap[slot] || 0;
      return {
        timeSlot: slot,
        maxCapacity: MAX_APPOINTMENTS_PER_SLOT,
        bookedCount: booked,
        isAvailable: booked < MAX_APPOINTMENTS_PER_SLOT,
      };
    });
  } catch (error) {
    console.error('[appointments.getAvailableSlots error]', error);
    return STANDARD_TIME_SLOTS.map((slot) => ({
      timeSlot: slot,
      maxCapacity: MAX_APPOINTMENTS_PER_SLOT,
      bookedCount: 0,
      isAvailable: true,
    }));
  }
}

/**
 * Book an in-person desk appointment linked to an application or resident
 */
export async function bookAppointment(data: {
  serviceId: string;
  applicationId?: string;
  residentId?: string;
  scheduledDate: string; // YYYY-MM-DD
  timeSlot: string;
  purpose: string;
}): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
  try {
    const session = await getCurrentUser();
    const scheduledBy = session?.userId || null;
    const targetResidentId = data.residentId || session?.residentId || null;

    return await withTransaction(async (client) => {
      // 1. Check double-booking constraint inside transaction
      const existingCount = await client.query(
        `SELECT COUNT(*) as count
         FROM barangay.appointments
         WHERE scheduled_date = $1 
           AND time_slot = $2 
           AND service_id = $3
           AND status NOT IN ('cancelled', 'no_show')`,
        [data.scheduledDate, data.timeSlot, data.serviceId]
      );

      const currentCount = parseInt(existingCount.rows[0]?.count || '0', 10);
      if (currentCount >= MAX_APPOINTMENTS_PER_SLOT) {
        throw new Error(
          `The selected time slot (${data.timeSlot}) on ${data.scheduledDate} is already fully booked. Please select another time.`
        );
      }

      // 2. Insert appointment record
      const insertRes = await client.query(
        `INSERT INTO barangay.appointments (
          application_id, resident_id, service_id, scheduled_by,
          scheduled_date, time_slot, purpose, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
        RETURNING id`,
        [
          data.applicationId || null,
          targetResidentId,
          data.serviceId,
          scheduledBy,
          data.scheduledDate,
          data.timeSlot,
          data.purpose.trim(),
        ]
      );

      const appointmentId = insertRes.rows[0].id;

      // 3. Notify user if authenticated
      if (scheduledBy) {
        await client.query(
          `INSERT INTO barangay.notifications (user_id, type, title, body, data, is_read, created_at)
           VALUES ($1, 'APPOINTMENT_SCHEDULED', $2, $3, $4, false, NOW())`,
          [
            scheduledBy,
            `Appointment Confirmed: ${data.scheduledDate} (${data.timeSlot})`,
            `Your desk appointment for purpose "${data.purpose}" has been recorded. Please arrive 10 minutes early with valid identification.`,
            JSON.stringify({ appointmentId, date: data.scheduledDate, timeSlot: data.timeSlot }),
          ]
        );
      }

      // 4. Audit log
      await client.query(
        `INSERT INTO barangay.audit_logs (user_id, action, entity_type, entity_id, new_values)
         VALUES ($1, 'BOOK_APPOINTMENT', 'appointments', $2, $3)`,
        [
          scheduledBy,
          appointmentId,
          JSON.stringify({
            date: data.scheduledDate,
            slot: data.timeSlot,
            serviceId: data.serviceId,
          }),
        ]
      );

      return { success: true, appointmentId };
    });
  } catch (err: any) {
    console.error('[appointments.bookAppointment error]', err);
    return { success: false, error: err?.message || 'Failed to book appointment.' };
  }
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(
  appointmentId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAuth();

    const appt = await queryOne<AppointmentItem>(
      `SELECT * FROM barangay.appointments WHERE id = $1`,
      [appointmentId]
    );

    if (!appt) {
      return { success: false, error: 'Appointment not found.' };
    }

    // Authorization: User must be the owner or staff/admin
    const isOwner = appt.scheduled_by === session.userId;
    const isStaff = ['staff', 'admin', 'super_admin'].includes(session.role);

    if (!isOwner && !isStaff) {
      return { success: false, error: 'You are not authorized to cancel this appointment.' };
    }

    await query(
      `UPDATE barangay.appointments
       SET status = 'cancelled'
       WHERE id = $1`,
      [appointmentId]
    );

    await query(
      `INSERT INTO barangay.audit_logs (user_id, action, entity_type, entity_id, new_values)
       VALUES ($1, 'CANCEL_APPOINTMENT', 'appointments', $2, $3)`,
      [session.userId, appointmentId, JSON.stringify({ reason })]
    );

    return { success: true };
  } catch (err: any) {
    console.error('[appointments.cancelAppointment error]', err);
    return { success: false, error: err?.message || 'Failed to cancel appointment.' };
  }
}

/**
 * Fetch upcoming appointments for staff desk schedule
 */
export async function getUpcomingAppointments(date?: string): Promise<AppointmentItem[]> {
  await requireRole(['staff', 'admin', 'super_admin']);

  const dateFilter = date || new Date().toISOString().split('T')[0];

  return await query<AppointmentItem>(
    `SELECT ap.*, s.name AS service_name, 
            CONCAT(r.first_name, ' ', r.last_name) AS resident_name
     FROM barangay.appointments ap
     JOIN barangay.services s ON ap.service_id = s.id
     LEFT JOIN barangay.residents r ON ap.resident_id = r.id
     WHERE ap.scheduled_date = $1
     ORDER BY ap.time_slot ASC`,
    [dateFilter]
  );
}
