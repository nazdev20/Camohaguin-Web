'use server';

/**
 * Public Citizen Portal Server Actions (Schema: barangay)
 */

import { query, queryOne } from '../../lib/db';
import { getCurrentUser, requireRole } from './auth';
import {
  AnnouncementItem,
  EventItem,
  FeedbackItem,
  Official,
  SiteSetting,
} from '../../types/barangay';
import { serverLruCache, CacheKeys } from '../../lib/lruCache';

/**
 * Fetch public announcements
 * Ordered by: Pinned first, then newest published, excluding expired
 * Cached in server-side LRU cache (10 min TTL)
 */
export async function getPublicAnnouncements(limit = 10): Promise<AnnouncementItem[]> {
  try {
    return await serverLruCache.wrap(
      CacheKeys.publicAnnouncements(limit),
      async () => {
        return await query<AnnouncementItem>(
          `SELECT id, title, body, category, is_pinned, is_published, published_at, expires_at
           FROM barangay.announcements
           WHERE is_published = true 
             AND (expires_at IS NULL OR expires_at > NOW())
           ORDER BY is_pinned DESC, published_at DESC
           LIMIT $1`,
          [limit]
        );
      },
      10 * 60 * 1000
    );
  } catch (error) {
    console.error('[public.getPublicAnnouncements error]', error);
    return [];
  }
}

/**
 * Create an announcement (Admin/Staff only)
 * Mutates database -> Invalidates announcements LRU cache
 */
export async function createAnnouncement(data: {
  title: string;
  body: string;
  category: string;
  isPinned?: boolean;
  expiresAt?: string | null;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const session = await requireRole(['staff', 'admin', 'super_admin']);

    const row = await queryOne<{ id: string }>(
      `INSERT INTO barangay.announcements (title, body, category, is_pinned, is_published, expires_at, created_by)
       VALUES ($1, $2, $3, $4, true, $5, $6)
       RETURNING id`,
      [
        data.title.trim(),
        data.body.trim(),
        data.category,
        data.isPinned ?? false,
        data.expiresAt || null,
        session.userId,
      ]
    );

    if (row) {
      await query(
        `INSERT INTO barangay.audit_logs (user_id, action, entity_type, entity_id, new_values)
         VALUES ($1, 'CREATE_ANNOUNCEMENT', 'announcements', $2, $3)`,
        [session.userId, row.id, JSON.stringify(data)]
      );

      // Invalidate server-side LRU cache for announcements
      serverLruCache.invalidatePrefix('announcements:');
    }

    return { success: true, id: row?.id };
  } catch (err: any) {
    console.error('[public.createAnnouncement error]', err);
    return { success: false, error: err?.message || 'Failed to create announcement.' };
  }
}

/**
 * Fetch public upcoming community events
 * Cached in server-side LRU cache (10 min TTL)
 */
export async function getPublicEvents(limit = 10): Promise<EventItem[]> {
  try {
    return await serverLruCache.wrap(
      CacheKeys.publicEvents(limit),
      async () => {
        return await query<EventItem>(
          `SELECT id, title, description, location, start_at, end_at, is_published, is_cancelled
           FROM barangay.events
           WHERE is_published = true 
             AND is_cancelled = false 
             AND end_at >= NOW() - INTERVAL '1 day'
           ORDER BY start_at ASC
           LIMIT $1`,
          [limit]
        );
      },
      10 * 60 * 1000
    );
  } catch (error) {
    console.error('[public.getPublicEvents error]', error);
    return [];
  }
}

/**
 * Fetch public site settings for branding, header, hotlines, and office hours
 * Cached in server-side LRU cache (10 min TTL)
 */
export async function getSiteSettings(): Promise<Record<string, string>> {
  try {
    return await serverLruCache.wrap(
      CacheKeys.siteSettings(),
      async () => {
        const rows = await query<SiteSetting>(
          `SELECT key, value, data_type FROM barangay.site_settings WHERE is_public = true`
        );

        const settingsMap: Record<string, string> = {};
        for (const r of rows) {
          settingsMap[r.key] = r.value;
        }
        return settingsMap;
      },
      10 * 60 * 1000
    );
  } catch (error) {
    console.error('[public.getSiteSettings error]', error);
    return {
      barangay_name: 'Barangay Camohaguin',
      municipality: 'Gumaca',
      province: 'Quezon',
      emergency_phone: '(042) 317-8890',
      office_hours: 'Monday to Friday: 8:00 AM - 5:00 PM',
    };
  }
}

/**
 * Fetch active barangay officials directory
 * Cached in server-side LRU cache (10 min TTL)
 */
export async function getPublicOfficials(): Promise<Official[]> {
  try {
    return await serverLruCache.wrap(
      CacheKeys.publicOfficials(),
      async () => {
        return await query<Official>(
          `SELECT o.id, o.resident_id, o.position, o.committee, o.term_start, o.term_end, o.is_active,
                  r.first_name, r.last_name, r.suffix, r.email_address
           FROM barangay.officials o
           JOIN barangay.residents r ON o.resident_id = r.id
           WHERE o.is_active = true
           ORDER BY 
             CASE 
               WHEN o.position ILIKE '%Captain%' OR o.position ILIKE '%Punong%' THEN 1
               WHEN o.position ILIKE '%Kagawad%' THEN 2
               WHEN o.position ILIKE '%SK%' THEN 3
               WHEN o.position ILIKE '%Secretary%' THEN 4
               WHEN o.position ILIKE '%Treasurer%' THEN 5
               ELSE 6
             END,
             r.last_name ASC`
        );
      },
      10 * 60 * 1000
    );
  } catch (error) {
    console.error('[public.getPublicOfficials error]', error);
    return [];
  }
}

/**
 * Submit citizen feedback or rating for a service
 */
export async function submitFeedback(data: {
  serviceId?: string;
  rating: number; // 1 to 5
  comment?: string;
  isAnonymous?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentUser();
    const userId = data.isAnonymous ? null : session?.userId || null;
    const residentId = data.isAnonymous ? null : session?.residentId || null;

    if (data.rating < 1 || data.rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5 stars.' };
    }

    await query(
      `INSERT INTO barangay.feedback (
        user_id, resident_id, service_id, rating, comment, is_anonymous, is_published
      ) VALUES ($1, $2, $3, $4, $5, $6, true)`,
      [
        userId,
        residentId,
        data.serviceId || null,
        data.rating,
        data.comment?.trim() || null,
        data.isAnonymous ?? false,
      ]
    );

    return { success: true };
  } catch (err: any) {
    console.error('[public.submitFeedback error]', err);
    return { success: false, error: err?.message || 'Failed to submit feedback.' };
  }
}
