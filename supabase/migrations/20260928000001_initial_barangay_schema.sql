-- ==============================================================================
-- BARANGAY CAMOHAGUIN SERVICE PORTAL - CORE DATABASE MIGRATION
-- Target: PostgreSQL / Supabase
-- Description: Normalized schema for core barangay governance, residency, 
--              service requests, appointments, concerns, and audit logging.
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. ENUMS & DOMAIN TYPES
-- ==============================================================================
CREATE TYPE residency_status_enum AS ENUM (
    'unverified', 
    'verified', 
    'inactive', 
    'transferred'
);

CREATE TYPE request_status_enum AS ENUM (
    'Submitted',
    'Under Review',
    'For Correction',
    'Approved',
    'Rejected',
    'Ready for Release',
    'Completed'
);

CREATE TYPE appointment_status_enum AS ENUM (
    'Scheduled',
    'Completed',
    'Cancelled',
    'Rescheduled'
);

CREATE TYPE complaint_status_enum AS ENUM (
    'Open',
    'Under Investigation',
    'Mediation Scheduled',
    'Resolved',
    'Dismissed'
);

CREATE TYPE priority_level_enum AS ENUM (
    'Normal',
    'Urgent',
    'Advisory'
);

CREATE TYPE project_status_enum AS ENUM (
    'Planned',
    'Ongoing',
    'Completed'
);

CREATE TYPE staff_role_enum AS ENUM (
    'Barangay Captain',
    'Barangay Secretary',
    'Barangay Treasurer',
    'Barangay Kagawad',
    'Desk Clerk'
);

-- ==============================================================================
-- 2. HOUSEHOLDS TABLE
-- Groups residents by dwelling unit within Barangay Camohaguin's Puroks
-- ==============================================================================
CREATE TABLE households (
    household_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_number VARCHAR(30) UNIQUE NOT NULL,
    purok_zone VARCHAR(50) NOT NULL CHECK (purok_zone IN ('Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Purok 6', 'Purok 7')),
    street_address TEXT NOT NULL,
    head_resident_id UUID, -- Foreign key added after residents table
    total_members INT DEFAULT 1 CHECK (total_members >= 1),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==============================================================================
-- 3. RESIDENTS TABLE
-- Internal registry for residency verification (Never exposed entirely to public)
-- ==============================================================================
CREATE TABLE residents (
    resident_id VARCHAR(30) PRIMARY KEY, -- Internal system identifier, e.g. 'BC-RES-00104'
    household_id UUID REFERENCES households(household_id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20),
    birth_date DATE NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    civil_status VARCHAR(30) NOT NULL CHECK (civil_status IN ('Single', 'Married', 'Widowed', 'Separated', 'Solo Parent')),
    contact_number VARCHAR(20),
    email VARCHAR(150),
    address TEXT NOT NULL,
    purok_zone VARCHAR(50) NOT NULL CHECK (purok_zone IN ('Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Purok 6', 'Purok 7')),
    is_registered_voter BOOLEAN DEFAULT true NOT NULL,
    residency_status residency_status_enum DEFAULT 'unverified' NOT NULL,
    verified_at TIMESTAMPTZ,
    verified_by_user_id UUID,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add foreign key constraint back to households.head_resident_id
ALTER TABLE households 
ADD CONSTRAINT fk_household_head 
FOREIGN KEY (head_resident_id) 
REFERENCES residents(resident_id) 
DEFERRABLE INITIALLY DEFERRED;

-- Composite index for fast, case-insensitive residency verification lookup
CREATE INDEX idx_residents_verification 
ON residents (LOWER(last_name), LOWER(first_name), birth_date);

CREATE INDEX idx_residents_purok ON residents(purok_zone);
CREATE INDEX idx_residents_status ON residents(residency_status);

-- ==============================================================================
-- 4. SERVICES TABLE
-- Configurable catalog of services offered by Barangay Camohaguin
-- ==============================================================================
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL, -- e.g. 'BC-CLR', 'BC-INDIGENCY'
    name VARCHAR(150) NOT NULL,
    category VARCHAR(60) NOT NULL, -- e.g. 'Clearances & Certifications', 'Social Services', 'Business'
    description TEXT NOT NULL,
    processing_days INT DEFAULT 1 NOT NULL CHECK (processing_days >= 0),
    fee_amount NUMERIC(10,2) DEFAULT 0.00 NOT NULL CHECK (fee_amount >= 0),
    requires_residency_verification BOOLEAN DEFAULT true NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==============================================================================
-- 5. SERVICE REQUIREMENTS TABLE
-- Document and eligibility requirements tied to each service
-- ==============================================================================
CREATE TABLE service_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    requirement_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT true NOT NULL,
    file_type_hint VARCHAR(100) DEFAULT 'PDF, JPG, PNG' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_requirements_service ON service_requirements(service_id);

-- ==============================================================================
-- 6. SERVICE REQUESTS TABLE
-- Application filings submitted by residents or applicants
-- ==============================================================================
CREATE TABLE service_requests (
    tracking_number VARCHAR(35) PRIMARY KEY, -- e.g. 'BC-2026-0928-8492'
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    resident_id VARCHAR(30) REFERENCES residents(resident_id) ON DELETE SET NULL,
    applicant_first_name VARCHAR(100) NOT NULL,
    applicant_middle_name VARCHAR(100),
    applicant_last_name VARCHAR(100) NOT NULL,
    applicant_suffix VARCHAR(20),
    applicant_contact VARCHAR(25) NOT NULL,
    applicant_email VARCHAR(150),
    purok_zone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    purpose TEXT NOT NULL,
    residency_verified BOOLEAN DEFAULT false NOT NULL,
    status request_status_enum DEFAULT 'Submitted' NOT NULL,
    admin_remarks TEXT,
    rejection_reason TEXT,
    target_release_date DATE,
    actual_released_at TIMESTAMPTZ,
    reviewed_by_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_resident ON service_requests(resident_id);
CREATE INDEX idx_service_requests_created ON service_requests(created_at DESC);

-- ==============================================================================
-- 7. REQUEST DOCUMENTS TABLE
-- Uploaded attachments associated with a specific service request
-- ==============================================================================
CREATE TABLE request_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_tracking_number VARCHAR(35) NOT NULL REFERENCES service_requests(tracking_number) ON DELETE CASCADE,
    requirement_id UUID REFERENCES service_requirements(id) ON DELETE SET NULL,
    document_name VARCHAR(200) NOT NULL,
    file_url TEXT NOT NULL,
    file_size_kb INT,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_verified BOOLEAN DEFAULT false NOT NULL
);

CREATE INDEX idx_req_docs_tracking ON request_documents(request_tracking_number);

-- ==============================================================================
-- 8. APPOINTMENTS TABLE
-- Physical in-person desk or mediation appointments
-- ==============================================================================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_number VARCHAR(35) UNIQUE NOT NULL,
    request_tracking_number VARCHAR(35) REFERENCES service_requests(tracking_number) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(25) NOT NULL,
    service_name VARCHAR(150) NOT NULL,
    scheduled_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL, -- e.g. '09:00 AM - 10:00 AM'
    status appointment_status_enum DEFAULT 'Scheduled' NOT NULL,
    purpose TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_appointments_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- ==============================================================================
-- 9. COMPLAINTS & CONCERNS (LUPON / DESK)
-- Community grievances, peace & order incidents, mediation requests
-- ==============================================================================
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(35) UNIQUE NOT NULL, -- e.g. 'BLOT-2026-0045'
    complainant_name VARCHAR(150) NOT NULL,
    complainant_contact VARCHAR(25),
    complainant_purok VARCHAR(50),
    is_anonymous BOOLEAN DEFAULT false NOT NULL,
    category VARCHAR(80) NOT NULL, -- e.g. 'Neighborhood Dispute', 'Noise Complaint', 'Sanitation', 'Peace & Order'
    incident_date DATE NOT NULL,
    incident_location TEXT NOT NULL,
    description TEXT NOT NULL,
    status complaint_status_enum DEFAULT 'Open' NOT NULL,
    mediation_scheduled_at TIMESTAMPTZ,
    resolution_notes TEXT,
    assigned_officer VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_created ON complaints(created_at DESC);

-- ==============================================================================
-- 10. ANNOUNCEMENTS TABLE
-- Official barangay advisories, assembly calls, emergency notices
-- ==============================================================================
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(250) NOT NULL,
    category VARCHAR(80) NOT NULL, -- e.g. 'Public Advisory', 'Health & Wellness', 'General Assembly', 'Disaster Prep'
    content TEXT NOT NULL,
    priority priority_level_enum DEFAULT 'Normal' NOT NULL,
    target_audience VARCHAR(100) DEFAULT 'All Residents' NOT NULL,
    is_published BOOLEAN DEFAULT true NOT NULL,
    published_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at TIMESTAMPTZ,
    author_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_announcements_published ON announcements(is_published, published_at DESC);

-- ==============================================================================
-- 11. PUBLIC DOCUMENTS TABLE
-- Approved ordinances, resolutions, budget allocations for public transparency
-- ==============================================================================
CREATE TABLE public_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(250) NOT NULL,
    category VARCHAR(80) NOT NULL, -- e.g. 'Barangay Ordinance', 'Resolution', 'Annual Budget Report', 'Executive Order'
    reference_number VARCHAR(100) NOT NULL,
    fiscal_year INT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    published_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==============================================================================
-- 12. PROJECTS TABLE
-- Barangay infrastructure, welfare programs, disaster-risk mitigation projects
-- ==============================================================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(250) NOT NULL,
    description TEXT NOT NULL,
    purok_location VARCHAR(100) NOT NULL,
    budget_allocated NUMERIC(14,2) NOT NULL CHECK (budget_allocated >= 0),
    status project_status_enum DEFAULT 'Planned' NOT NULL,
    start_date DATE NOT NULL,
    target_completion_date DATE,
    person_in_charge VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==============================================================================
-- 13. ADMIN / STAFF USERS TABLE
-- Authorized barangay personnel with role-based access
-- ==============================================================================
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(30) UNIQUE NOT NULL, -- e.g. 'BC-STF-01'
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role staff_role_enum NOT NULL,
    department VARCHAR(80) DEFAULT 'Barangay Administration' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==============================================================================
-- 14. AUDIT LOGS TABLE
-- Immutable security trail of sensitive operations (status updates, residency checks)
-- ==============================================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    actor_name VARCHAR(150) NOT NULL,
    action VARCHAR(100) NOT NULL, -- e.g. 'UPDATE_REQUEST_STATUS', 'VERIFY_RESIDENCY', 'CREATE_SERVICE'
    entity_type VARCHAR(60) NOT NULL, -- 'service_requests', 'residents', 'services', etc.
    entity_id VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ==============================================================================
-- 15. SECURE RESIDENCY VERIFICATION FUNCTION (PostgreSQL Stored Procedure)
-- Verifies residency without leaking the full registry or census details
-- ==============================================================================
CREATE OR REPLACE FUNCTION verify_residency_secure(
    p_first_name VARCHAR,
    p_last_name VARCHAR,
    p_birth_date DATE
)
RETURNS TABLE (
    is_verified BOOLEAN,
    resident_id VARCHAR,
    residency_status residency_status_enum,
    purok_zone VARCHAR,
    message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_resident RECORD;
BEGIN
    SELECT r.resident_id, r.residency_status, r.purok_zone
    INTO v_resident
    FROM residents r
    WHERE LOWER(TRIM(r.first_name)) = LOWER(TRIM(p_first_name))
      AND LOWER(TRIM(r.last_name)) = LOWER(TRIM(p_last_name))
      AND r.birth_date = p_birth_date
    LIMIT 1;

    IF FOUND THEN
        IF v_resident.residency_status = 'verified' THEN
            RETURN QUERY SELECT 
                true, 
                v_resident.resident_id, 
                v_resident.residency_status, 
                v_resident.purok_zone, 
                'Resident record verified in Barangay Camohaguin Registry.'::TEXT;
        ELSE
            RETURN QUERY SELECT 
                false, 
                v_resident.resident_id, 
                v_resident.residency_status, 
                v_resident.purok_zone, 
                'Resident record found but status is ' || v_resident.residency_status::TEXT || '. Please contact Barangay Hall.'::TEXT;
        END IF;
    ELSE
        RETURN QUERY SELECT 
            false, 
            NULL::VARCHAR, 
            NULL::residency_status_enum, 
            NULL::VARCHAR, 
            'No matching resident record found in Barangay Camohaguin database.'::TEXT;
    END IF;
END;
$$;
