/**
 * Barangay System Type Definitions (Schema: barangay)
 */

export type UserRoleName = 'resident' | 'staff' | 'admin' | 'super_admin';

export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'for_compliance'
  | 'approved'
  | 'rejected'
  | 'ready_for_release'
  | 'released'
  | 'cancelled';

export type ApplicationPriority = 'standard' | 'urgent';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type ResidencyStatus =
  | 'verified'
  | 'unverified'
  | 'temporary'
  | 'transferred'
  | 'deceased';

export interface Role {
  id: number;
  name: UserRoleName;
  description: string | null;
}

export interface Permission {
  id: number;
  name: string;
  module: string;
}

export interface Resident {
  id: string; // UUID
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  date_of_birth: string; // YYYY-MM-DD
  sex: 'male' | 'female' | 'other';
  civil_status: 'single' | 'married' | 'widowed' | 'separated';
  contact_number: string | null;
  email_address: string | null;
  purok: string;
  street_address: string;
  primary_id_type: string | null;
  primary_id_number: string | null;
  is_voter: boolean;
  is_active: boolean;
  residency_status: ResidencyStatus;
  created_at?: string;
  updated_at?: string;
}

export interface UserAccount {
  id: string; // UUID
  role_id: number;
  resident_id: string | null; // UUID
  email: string;
  password_hash: string;
  is_active: boolean;
  failed_login_attempts: number;
  locked_until: string | null; // ISO timestamp
  created_at?: string;
  updated_at?: string;
}

export interface Household {
  id: string; // UUID
  household_code: string;
  head_resident_id: string;
  address: string;
  purok: string;
  ownership_type: 'owned' | 'rented' | 'informal_settler' | 'living_with_relatives';
  is_4ps_beneficiary: boolean;
  created_at?: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  resident_id: string;
  relationship: string;
  is_current: boolean;
}

export interface Official {
  id: string;
  resident_id: string;
  position: string;
  committee: string | null;
  term_start: string;
  term_end: string;
  is_active: boolean;
  // Joined resident fields
  first_name?: string;
  last_name?: string;
  suffix?: string | null;
  email_address?: string | null;
}

export interface ServiceRequirement {
  name: string;
  description?: string;
  is_mandatory: boolean;
}

export interface ServiceItem {
  id: string; // UUID
  name: string;
  description: string;
  category: string;
  fee: number;
  processing_days: number;
  requirements: ServiceRequirement[] | string[];
  requires_appointment: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Application {
  id: string; // UUID
  tracking_number: string;
  service_id: string;
  resident_id: string | null;
  user_id: string | null;
  purpose: string;
  applicant_notes: string | null;
  status: ApplicationStatus;
  priority: ApplicationPriority;
  assigned_to: string | null; // UUID of staff user
  staff_notes: string | null;
  fee_amount: number;
  submitted_at: string;
  approved_at: string | null;
  released_at: string | null;
  // Joined fields
  service_name?: string;
  service_category?: string;
  first_name?: string;
  last_name?: string;
  contact_number?: string;
  email_address?: string;
  purok?: string;
}

export interface ApplicationStatusHistory {
  id: string;
  application_id: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  changed_by: string | null; // UUID
  changed_by_name?: string | null;
  notes: string | null;
  changed_at: string;
}

export interface ApplicationDocument {
  id: string;
  application_id: string;
  uploaded_by: string | null; // user_id
  document_type: string;
  file_name: string;
  file_path: string;
  is_verified: boolean;
  created_at?: string;
}

export interface AppointmentItem {
  id: string;
  application_id: string | null;
  resident_id: string | null;
  service_id: string;
  scheduled_by: string | null; // user_id
  scheduled_date: string; // YYYY-MM-DD
  time_slot: string; // e.g. "09:00 - 10:00"
  purpose: string;
  status: AppointmentStatus;
  created_at?: string;
  // Joined fields
  service_name?: string;
  resident_name?: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  category: string;
  is_pinned: boolean;
  is_published: boolean;
  published_at: string;
  expires_at: string | null;
  created_at?: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  location: string;
  start_at: string;
  end_at: string;
  is_published: boolean;
  is_cancelled: boolean;
}

export interface FeedbackItem {
  id: string;
  user_id: string | null;
  resident_id: string | null;
  service_id: string | null;
  rating: number; // 1 - 5
  comment: string | null;
  is_anonymous: boolean;
  is_published: boolean;
  created_at?: string;
}

export interface AuditLogItem {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
  user_email?: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  is_public: boolean;
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRoleName;
  residentId: string | null;
  [key: string]: any;
}
