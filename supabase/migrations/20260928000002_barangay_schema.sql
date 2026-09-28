-- ==============================================================================
-- BARANGAY PRODUCTION DATABASE SCHEMA (Schema: barangay)
-- Target: PostgreSQL / Supabase
-- Description: Complete normalized schema, functions, triggers, and seed roles.
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS barangay;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS barangay.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, -- 'resident', 'staff', 'admin', 'super_admin'
    description TEXT
);

CREATE TABLE IF NOT EXISTS barangay.permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS barangay.role_permissions (
    role_id INT REFERENCES barangay.roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES barangay.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 2. RESIDENTS PROFILE
CREATE TABLE IF NOT EXISTS barangay.residents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20),
    date_of_birth DATE NOT NULL,
    sex VARCHAR(20) NOT NULL CHECK (sex IN ('male', 'female', 'other')),
    civil_status VARCHAR(30) NOT NULL CHECK (civil_status IN ('single', 'married', 'widowed', 'separated')),
    contact_number VARCHAR(25),
    email_address VARCHAR(150),
    purok VARCHAR(50) NOT NULL,
    street_address TEXT NOT NULL,
    primary_id_type VARCHAR(100),
    primary_id_number VARCHAR(100),
    is_voter BOOLEAN DEFAULT true NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    residency_status VARCHAR(30) DEFAULT 'unverified' NOT NULL CHECK (residency_status IN ('verified', 'unverified', 'temporary', 'transferred', 'deceased')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_residents_lookup ON barangay.residents (LOWER(last_name), LOWER(first_name), date_of_birth);
CREATE INDEX IF NOT EXISTS idx_residents_purok ON barangay.residents (purok);

-- 3. USERS & AUTHENTICATION
CREATE TABLE IF NOT EXISTS barangay.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id INT NOT NULL REFERENCES barangay.roles(id) ON DELETE RESTRICT,
    resident_id UUID REFERENCES barangay.residents(id) ON DELETE SET NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    failed_login_attempts INT DEFAULT 0 NOT NULL,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON barangay.users (LOWER(email));

-- 4. HOUSEHOLDS & MEMBERS
CREATE TABLE IF NOT EXISTS barangay.households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_code VARCHAR(50) UNIQUE NOT NULL,
    head_resident_id UUID NOT NULL REFERENCES barangay.residents(id) ON DELETE RESTRICT,
    address TEXT NOT NULL,
    purok VARCHAR(50) NOT NULL,
    ownership_type VARCHAR(50) NOT NULL DEFAULT 'owned' CHECK (ownership_type IN ('owned', 'rented', 'informal_settler', 'living_with_relatives')),
    is_4ps_beneficiary BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS barangay.household_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES barangay.households(id) ON DELETE CASCADE,
    resident_id UUID NOT NULL REFERENCES barangay.residents(id) ON DELETE CASCADE,
    relationship VARCHAR(50) NOT NULL,
    is_current BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (household_id, resident_id)
);

-- 5. OFFICIALS
CREATE TABLE IF NOT EXISTS barangay.officials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID NOT NULL REFERENCES barangay.residents(id) ON DELETE CASCADE,
    position VARCHAR(100) NOT NULL,
    committee VARCHAR(150),
    term_start DATE NOT NULL,
    term_end DATE NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. SERVICES CATALOG
CREATE TABLE IF NOT EXISTS barangay.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(80) NOT NULL,
    fee NUMERIC(10,2) DEFAULT 0.00 NOT NULL CHECK (fee >= 0),
    processing_days INT DEFAULT 1 NOT NULL CHECK (processing_days >= 0),
    requirements JSONB DEFAULT '[]'::JSONB NOT NULL,
    requires_appointment BOOLEAN DEFAULT false NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Sequence for tracking numbers
CREATE SEQUENCE IF NOT EXISTS barangay.tracking_number_seq START 1;

-- 7. APPLICATIONS
CREATE TABLE IF NOT EXISTS barangay.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_number VARCHAR(50) UNIQUE NOT NULL,
    service_id UUID NOT NULL REFERENCES barangay.services(id) ON DELETE RESTRICT,
    resident_id UUID REFERENCES barangay.residents(id) ON DELETE SET NULL,
    user_id UUID REFERENCES barangay.users(id) ON DELETE SET NULL,
    purpose TEXT NOT NULL,
    applicant_notes TEXT,
    status VARCHAR(40) DEFAULT 'submitted' NOT NULL CHECK (status IN ('submitted', 'under_review', 'for_compliance', 'approved', 'rejected', 'ready_for_release', 'released', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'standard' NOT NULL CHECK (priority IN ('standard', 'urgent')),
    assigned_to UUID REFERENCES barangay.users(id) ON DELETE SET NULL,
    staff_notes TEXT,
    fee_amount NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    approved_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_applications_tracking ON barangay.applications (tracking_number);
CREATE INDEX IF NOT EXISTS idx_applications_status ON barangay.applications (status);

-- 8. APPLICATION STATUS HISTORY
CREATE TABLE IF NOT EXISTS barangay.application_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES barangay.applications(id) ON DELETE CASCADE,
    from_status VARCHAR(40),
    to_status VARCHAR(40) NOT NULL,
    changed_by UUID REFERENCES barangay.users(id) ON DELETE SET NULL,
    notes TEXT,
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 9. APPLICATION DOCUMENTS
CREATE TABLE IF NOT EXISTS barangay.application_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES barangay.applications(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES barangay.users(id) ON DELETE SET NULL,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 10. APPOINTMENTS
CREATE TABLE IF NOT EXISTS barangay.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES barangay.applications(id) ON DELETE SET NULL,
    resident_id UUID REFERENCES barangay.residents(id) ON DELETE SET NULL,
    service_id UUID NOT NULL REFERENCES barangay.services(id) ON DELETE RESTRICT,
    scheduled_by UUID REFERENCES barangay.users(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'scheduled' NOT NULL CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_appointments_slot ON barangay.appointments (scheduled_date, time_slot, status);

-- 11. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS barangay.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES barangay.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON barangay.notifications (user_id, is_read);

-- 12. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS barangay.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    category VARCHAR(80) NOT NULL,
    is_pinned BOOLEAN DEFAULT false NOT NULL,
    is_published BOOLEAN DEFAULT true NOT NULL,
    published_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 13. EVENTS
CREATE TABLE IF NOT EXISTS barangay.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(200) NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    is_published BOOLEAN DEFAULT true NOT NULL,
    is_cancelled BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 14. FEEDBACK
CREATE TABLE IF NOT EXISTS barangay.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES barangay.users(id) ON DELETE SET NULL,
    resident_id UUID REFERENCES barangay.residents(id) ON DELETE SET NULL,
    service_id UUID REFERENCES barangay.services(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT false NOT NULL,
    is_published BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 15. AUDIT LOGS
CREATE TABLE IF NOT EXISTS barangay.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES barangay.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON barangay.audit_logs (created_at DESC);

-- 16. SITE SETTINGS
CREATE TABLE IF NOT EXISTS barangay.site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    data_type VARCHAR(20) DEFAULT 'string' NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
    is_public BOOLEAN DEFAULT true NOT NULL
);

-- ==============================================================================
-- DATABASE FUNCTIONS
-- ==============================================================================

-- Function 1: get_user_role
CREATE OR REPLACE FUNCTION barangay.get_user_role(p_user_id UUID)
RETURNS TABLE (
    role_id INT,
    role_name VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT r.id, r.name
    FROM barangay.users u
    JOIN barangay.roles r ON u.role_id = r.id
    WHERE u.id = p_user_id;
END;
$$;

-- Function 2: get_role_permissions
CREATE OR REPLACE FUNCTION barangay.get_role_permissions(p_role_name VARCHAR)
RETURNS TABLE (
    permission_name VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT p.name
    FROM barangay.roles r
    JOIN barangay.role_permissions rp ON r.id = rp.role_id
    JOIN barangay.permissions p ON rp.permission_id = p.id
    WHERE r.name = p_role_name;
END;
$$;

-- Function 3: generate_tracking_number (Format: BRY-YYYY-000001)
CREATE OR REPLACE FUNCTION barangay.generate_tracking_number()
RETURNS VARCHAR
LANGUAGE plpgsql
AS $$
DECLARE
    v_year VARCHAR;
    v_seq BIGINT;
BEGIN
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    v_seq := NEXTVAL('barangay.tracking_number_seq');
    RETURN 'BRY-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$;

-- ==============================================================================
-- INITIAL SEED ROLES & PERMISSIONS
-- ==============================================================================
INSERT INTO barangay.roles (id, name, description) VALUES
(1, 'resident', 'Registered barangay citizen with basic service access'),
(2, 'staff', 'Desk clerk & civil registry processing personnel'),
(3, 'admin', 'Barangay Secretary, Treasurer, Kagawad with management clearance'),
(4, 'super_admin', 'Punong Barangay with full executive system override')
ON CONFLICT (id) DO NOTHING;

INSERT INTO barangay.site_settings (key, value, data_type, is_public) VALUES
('barangay_name', 'Barangay Camohaguin', 'string', true),
('municipality', 'Gumaca', 'string', true),
('province', 'Quezon', 'string', true),
('emergency_phone', '(042) 317-8890', 'string', true),
('office_hours', 'Monday to Friday: 8:00 AM - 5:00 PM', 'string', true)
ON CONFLICT (key) DO NOTHING;
