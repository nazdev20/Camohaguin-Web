/**
 * Barangay Camohaguin Service Portal - Type Definitions
 * Strictly maps to PostgreSQL / Supabase schema
 */

export type ResidencyStatus = 'unverified' | 'verified' | 'inactive' | 'transferred';

export type RequestStatus = 
  | 'Submitted'
  | 'Under Review'
  | 'For Correction'
  | 'Approved'
  | 'Rejected'
  | 'Ready for Release'
  | 'Completed';

export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';

export type ComplaintStatus = 'Open' | 'Under Investigation' | 'Mediation Scheduled' | 'Resolved' | 'Dismissed';

export type PriorityLevel = 'Normal' | 'Urgent' | 'Advisory';

export type ProjectStatus = 'Planned' | 'Ongoing' | 'Completed';

export type StaffRole = 
  | 'Barangay Captain'
  | 'Barangay Secretary'
  | 'Barangay Treasurer'
  | 'Barangay Kagawad'
  | 'Desk Clerk';

export interface Household {
  household_id: string;
  household_number: string;
  purok_zone: string;
  street_address: string;
  head_resident_id?: string;
  total_members: number;
  created_at: string;
  updated_at: string;
}

export interface Resident {
  resident_id: string; // Internal system identifier (e.g. BC-RES-00101)
  household_id?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  birth_date: string; // YYYY-MM-DD
  gender: 'Male' | 'Female' | 'Other';
  civil_status: 'Single' | 'Married' | 'Widowed' | 'Separated' | 'Solo Parent';
  contact_number?: string;
  email?: string;
  address: string;
  purok_zone: string;
  is_registered_voter: boolean;
  residency_status: ResidencyStatus;
  verified_at?: string;
  verified_by_user_id?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequirement {
  id: string;
  service_id: string;
  requirement_name: string;
  description?: string;
  is_mandatory: boolean;
  file_type_hint: string;
}

export interface BarangayService {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  processing_days: number;
  fee_amount: number;
  requires_residency_verification: boolean;
  is_active: boolean;
  requirements?: ServiceRequirement[];
  created_at: string;
  updated_at: string;
}

export interface RequestDocument {
  id: string;
  request_tracking_number: string;
  requirement_id?: string;
  document_name: string;
  file_url: string;
  file_size_kb?: number;
  uploaded_at: string;
  is_verified: boolean;
}

export interface ServiceRequest {
  tracking_number: string; // e.g. BC-2026-0928-1001
  service_id: string;
  service_name?: string;
  resident_id?: string;
  applicant_first_name: string;
  applicant_middle_name?: string;
  applicant_last_name: string;
  applicant_suffix?: string;
  applicant_contact: string;
  applicant_email?: string;
  purok_zone: string;
  address: string;
  purpose: string;
  residency_verified: boolean;
  status: RequestStatus;
  admin_remarks?: string;
  rejection_reason?: string;
  target_release_date?: string;
  actual_released_at?: string;
  reviewed_by_user_id?: string;
  reviewed_by_name?: string;
  created_at: string;
  updated_at: string;
  documents?: RequestDocument[];
}

export interface Appointment {
  id: string;
  appointment_number: string;
  request_tracking_number?: string;
  full_name: string;
  contact_number: string;
  service_name: string;
  scheduled_date: string; // YYYY-MM-DD
  time_slot: string;
  status: AppointmentStatus;
  purpose: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Complaint {
  id: string;
  ticket_number: string;
  complainant_name: string;
  complainant_contact?: string;
  complainant_purok?: string;
  is_anonymous: boolean;
  category: string;
  incident_date: string;
  incident_location: string;
  description: string;
  status: ComplaintStatus;
  mediation_scheduled_at?: string;
  resolution_notes?: string;
  assigned_officer?: string;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  category: string;
  content: string;
  priority: PriorityLevel;
  target_audience: string;
  is_published: boolean;
  published_at: string;
  expires_at?: string;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export interface PublicDocument {
  id: string;
  title: string;
  category: string;
  reference_number: string;
  fiscal_year: number;
  description?: string;
  file_url: string;
  is_active: boolean;
  published_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  purok_location: string;
  budget_allocated: number;
  status: ProjectStatus;
  start_date: string;
  target_completion_date?: string;
  person_in_charge: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  role: StaffRole;
  department: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

/**
 * Privacy-preserving Residency Verification result
 * (never leaks other resident records)
 */
export interface ResidencyVerificationResult {
  is_verified: boolean;
  resident_id?: string;
  residency_status?: ResidencyStatus;
  purok_zone?: string;
  message: string;
}
