-- ==============================================================================
-- BARANGAY CAMOHAGUIN SEED / MOCK DATA
-- Target: PostgreSQL / Supabase
-- ==============================================================================

-- 1. SEED ADMIN / STAFF USERS
INSERT INTO admin_users (id, employee_id, full_name, email, role, department, is_active) VALUES
('a0000000-0000-0000-0000-000000000001', 'BC-STF-01', 'Hon. Rodrigo M. Castillo', 'punongbarangay@camohaguin.gov.ph', 'Barangay Captain', 'Executive Office', true),
('a0000000-0000-0000-0000-000000000002', 'BC-STF-02', 'Elena S. Ramos', 'secretary@camohaguin.gov.ph', 'Barangay Secretary', 'Records & Administration', true),
('a0000000-0000-0000-0000-000000000003', 'BC-STF-03', 'Carlos T. Villanueva', 'treasurer@camohaguin.gov.ph', 'Barangay Treasurer', 'Treasury & Revenue', true),
('a0000000-0000-0000-0000-000000000004', 'BC-STF-04', 'Hon. Maria Clara B. Santos', 'kagawad.peace@camohaguin.gov.ph', 'Barangay Kagawad', 'Peace & Order Committee', true),
('a0000000-0000-0000-0000-000000000005', 'BC-STF-05', 'Jasmine P. Mendoza', 'desk@camohaguin.gov.ph', 'Desk Clerk', 'Frontline Public Assistance', true)
ON CONFLICT (employee_id) DO NOTHING;

-- 2. SEED HOUSEHOLDS
INSERT INTO households (household_id, household_number, purok_zone, street_address, total_members) VALUES
('h0000000-0000-0000-0000-000000000001', 'HH-2026-P1-001', 'Purok 1', '124 Rizal St., Purok 1 (Ilaya)', 4),
('h0000000-0000-0000-0000-000000000002', 'HH-2026-P2-014', 'Purok 2', '045 Mabini Extension, Purok 2', 3),
('h0000000-0000-0000-0000-000000000003', 'HH-2026-P3-008', 'Purok 3', '089 San Isidro Way, Purok 3 (Sentro)', 5),
('h0000000-0000-0000-0000-000000000004', 'HH-2026-P4-022', 'Purok 4', '201 Coconut Grove, Purok 4', 2),
('h0000000-0000-0000-0000-000000000005', 'HH-2026-P5-005', 'Purok 5', '012 Riverside Drive, Purok 5 (Ibaba)', 6),
('h0000000-0000-0000-0000-000000000006', 'HH-2026-P6-019', 'Purok 6', '167 Coastal Road, Purok 6', 3),
('h0000000-0000-0000-0000-000000000007', 'HH-2026-P7-011', 'Purok 7', '034 Hilltop Access, Purok 7 (Bukid)', 4)
ON CONFLICT (household_number) DO NOTHING;

-- 3. SEED RESIDENTS (Internal system IDs, verification status)
INSERT INTO residents (
    resident_id, household_id, first_name, middle_name, last_name, suffix, 
    birth_date, gender, civil_status, contact_number, email, address, 
    purok_zone, is_registered_voter, residency_status, verified_at, verified_by_user_id, remarks
) VALUES
('BC-RES-00101', 'h0000000-0000-0000-0000-000000000001', 'Juan', 'Dela', 'Cruz', NULL, '1988-05-12', 'Male', 'Married', '0917-123-4567', 'juan.delacruz@gmail.com', '124 Rizal St.', 'Purok 1', true, 'verified', '2025-01-10 09:00:00+08', 'a0000000-0000-0000-0000-000000000002', 'Head of household. Clean community standing.'),
('BC-RES-00102', 'h0000000-0000-0000-0000-000000000001', 'Maria', 'Santos', 'Cruz', NULL, '1990-08-23', 'Female', 'Married', '0917-234-5678', 'maria.cruz@gmail.com', '124 Rizal St.', 'Purok 1', true, 'verified', '2025-01-10 09:05:00+08', 'a0000000-0000-0000-0000-000000000002', 'Active BHW volunteer.'),
('BC-RES-00103', 'h0000000-0000-0000-0000-000000000002', 'Eduardo', 'Alvarez', 'Reyes', 'Jr.', '1975-11-04', 'Male', 'Married', '0920-345-6789', 'eduardo.reyes@yahoo.com', '045 Mabini Extension', 'Purok 2', true, 'verified', '2025-02-14 11:30:00+08', 'a0000000-0000-0000-0000-000000000002', 'Verified business owner (sari-sari store).'),
('BC-RES-00104', 'h0000000-0000-0000-0000-000000000003', 'Annalyn', 'Bautista', 'Mercado', NULL, '1995-02-18', 'Female', 'Single', '0928-456-7890', 'annalyn.m@gmail.com', '089 San Isidro Way', 'Purok 3', true, 'verified', '2025-03-01 14:00:00+08', 'a0000000-0000-0000-0000-000000000002', 'Fresh graduate, first-time jobseeker applicant.'),
('BC-RES-00105', 'h0000000-0000-0000-0000-000000000004', 'Danilo', 'Perez', 'Garcia', NULL, '1962-09-30', 'Male', 'Widowed', '0919-567-8901', NULL, '201 Coconut Grove', 'Purok 4', true, 'verified', '2025-01-15 10:15:00+08', 'a0000000-0000-0000-0000-000000000002', 'Senior Citizen ID #SC-0442.'),
('BC-RES-00106', 'h0000000-0000-0000-0000-000000000005', 'Lourdes', 'Morales', 'Tan', NULL, '2001-07-14', 'Female', 'Single', '0908-678-9012', 'lourdes.tan@student.edu.ph', '012 Riverside Drive', 'Purok 5', true, 'verified', '2025-02-20 15:00:00+08', 'a0000000-0000-0000-0000-000000000002', 'College scholar recipient.'),
('BC-RES-00107', 'h0000000-0000-0000-0000-000000000006', 'Ramon', 'Ignacio', 'Fernandez', NULL, '1983-04-05', 'Male', 'Married', '0945-789-0123', 'ramon.f@outlook.com', '167 Coastal Road', 'Purok 6', false, 'unverified', NULL, NULL, 'Pending residency physical inspection by Purok Leader.'),
('BC-RES-00108', 'h0000000-0000-0000-0000-000000000007', 'Grace', 'Torres', 'Navarro', NULL, '1992-12-01', 'Female', 'Solo Parent', '0939-890-1234', 'grace.navarro@gmail.com', '034 Hilltop Access', 'Purok 7', true, 'verified', '2025-01-18 13:20:00+08', 'a0000000-0000-0000-0000-000000000002', 'Registered Solo Parent with MSWDO.')
ON CONFLICT (resident_id) DO NOTHING;

-- Update household head pointers
UPDATE households SET head_resident_id = 'BC-RES-00101' WHERE household_number = 'HH-2026-P1-001';
UPDATE households SET head_resident_id = 'BC-RES-00103' WHERE household_number = 'HH-2026-P2-014';
UPDATE households SET head_resident_id = 'BC-RES-00104' WHERE household_number = 'HH-2026-P3-008';
UPDATE households SET head_resident_id = 'BC-RES-00105' WHERE household_number = 'HH-2026-P4-022';
UPDATE households SET head_resident_id = 'BC-RES-00106' WHERE household_number = 'HH-2026-P5-005';
UPDATE households SET head_resident_id = 'BC-RES-00107' WHERE household_number = 'HH-2026-P6-019';
UPDATE households SET head_resident_id = 'BC-RES-00108' WHERE household_number = 'HH-2026-P7-011';

-- 4. SEED SERVICES
INSERT INTO services (id, code, name, category, description, processing_days, fee_amount, requires_residency_verification, is_active) VALUES
('s0000000-0000-0000-0000-000000000001', 'BC-CLR', 'Barangay Clearance', 'Certifications & Clearances', 'Standard certification of good moral standing and residency for employment, bank accounts, or municipal permits.', 1, 50.00, true, true),
('s0000000-0000-0000-0000-000000000002', 'BC-IND', 'Certificate of Indigency', 'Social & Welfare Assistance', 'Official certificate for medical assistance, hospital billing discounts, educational scholarships, and legal aid.', 1, 0.00, true, true),
('s0000000-0000-0000-0000-000000000003', 'BC-RES', 'Certificate of Residency', 'Certifications & Clearances', 'Proof of bona fide residency in Barangay Camohaguin for school enrollment, postal ID, or government transactions.', 1, 30.00, true, true),
('s0000000-0000-0000-0000-000000000004', 'BC-BIZ', 'Barangay Business Clearance', 'Commercial & Permits', 'Required clearance for new or renewal business permits operating within the territorial jurisdiction of Barangay Camohaguin.', 2, 150.00, false, true),
('s0000000-0000-0000-0000-000000000005', 'BC-JOB', 'First-Time Jobseeker Assistance', 'Youth & Employment', 'Issuance of free barangay certification in compliance with Republic Act No. 11261 (First Time Jobseekers Assistance Act).', 1, 0.00, true, true),
('s0000000-0000-0000-0000-000000000006', 'BC-LUP', 'Lupon Mediation / Barangay Blotter', 'Peace, Order & Justice', 'Filing of disputes, neighborhood concerns, or barangay conciliation proceedings under Katarungang Pambarangay.', 3, 0.00, false, true)
ON CONFLICT (code) DO NOTHING;

-- 5. SEED SERVICE REQUIREMENTS
INSERT INTO service_requirements (id, service_id, requirement_name, description, is_mandatory, file_type_hint) VALUES
('r0000000-0000-0000-0000-000000000001', 's0000000-0000-0000-0000-000000000001', 'Valid Government Issued ID', 'Any government ID showing photo and address (or Student ID for minors)', true, 'PDF, JPG, PNG'),
('r0000000-0000-0000-0000-000000000002', 's0000000-0000-0000-0000-000000000001', 'Community Tax Certificate (Cedula)', 'Issued for the current calendar year', true, 'PDF, JPG, PNG'),
('r0000000-0000-0000-0000-000000000003', 's0000000-0000-0000-0000-000000000002', 'Endorsement / Proof of Need', 'Hospital clinical summary, school enrollment form, or MSWDO intake slip', true, 'PDF, JPG, PNG'),
('r0000000-0000-0000-0000-000000000004', 's0000000-0000-0000-0000-000000000002', 'Valid ID of Applicant', 'Proof of identity of applicant or guardian', true, 'PDF, JPG, PNG'),
('r0000000-0000-0000-0000-000000000005', 's0000000-0000-0000-0000-000000000003', 'Proof of Residence or Billing', 'Utility bill, lease agreement, or Purok Leader Certification', false, 'PDF, JPG, PNG'),
('r0000000-0000-0000-0000-000000000006', 's0000000-0000-0000-0000-000000000004', 'DTI or SEC Registration', 'Certificate of business name registration', true, 'PDF, JPG, PNG'),
('r0000000-0000-0000-0000-000000000007', 's0000000-0000-0000-0000-000000000004', 'Contract of Lease or Property Title', 'Location proof of business establishment', false, 'PDF, JPG, PNG'),
('r0000000-0000-0000-0000-000000000008', 's0000000-0000-0000-0000-000000000005', 'Oath of Undertaking (RA 11261)', 'Executed statement that applicant is a first-time jobseeker', true, 'PDF, JPG, PNG'),
('r0000000-0000-0000-0000-000000000009', 's0000000-0000-0000-0000-000000000005', 'School Diploma or Transcript / Form 137', 'Proof of educational attainment', true, 'PDF, JPG, PNG');

-- 6. SEED SERVICE REQUESTS (Covering all realistic states)
INSERT INTO service_requests (
    tracking_number, service_id, resident_id, applicant_first_name, applicant_middle_name, 
    applicant_last_name, applicant_suffix, applicant_contact, applicant_email, purok_zone, 
    address, purpose, residency_verified, status, admin_remarks, rejection_reason, 
    target_release_date, actual_released_at, reviewed_by_user_id, created_at
) VALUES
('BC-2026-0928-1001', 's0000000-0000-0000-0000-000000000001', 'BC-RES-00101', 'Juan', 'Dela', 'Cruz', NULL, '0917-123-4567', 'juan.delacruz@gmail.com', 'Purok 1', '124 Rizal St.', 'Requirement for local employment as security supervisor', true, 'Completed', 'Document picked up and signed in release registry.', NULL, '2026-09-26', '2026-09-26 14:20:00+08', 'a0000000-0000-0000-0000-000000000002', '2026-09-25 08:30:00+08'),

('BC-2026-0928-1002', 's0000000-0000-0000-0000-000000000002', 'BC-RES-00105', 'Danilo', 'Perez', 'Garcia', NULL, '0919-567-8901', NULL, 'Purok 4', '201 Coconut Grove', 'Medical assistance support for maintenance prescription at RHU', true, 'Ready for Release', 'Printed and dry-sealed. Please proceed to Window 2.', NULL, '2026-09-28', NULL, 'a0000000-0000-0000-0000-000000000002', '2026-09-27 10:15:00+08'),

('BC-2026-0928-1003', 's0000000-0000-0000-0000-000000000005', 'BC-RES-00104', 'Annalyn', 'Bautista', 'Mercado', NULL, '0928-456-7890', 'annalyn.m@gmail.com', 'Purok 3', '089 San Isidro Way', 'Application for Civil Service Exam eligibility & job application', true, 'Approved', 'Approved under RA 11261. Transferred to printing queue.', NULL, '2026-09-29', NULL, 'a0000000-0000-0000-0000-000000000002', '2026-09-27 15:40:00+08'),

('BC-2026-0928-1004', 's0000000-0000-0000-0000-000000000004', 'BC-RES-00103', 'Eduardo', 'Alvarez', 'Reyes', 'Jr.', '0920-345-6789', 'eduardo.reyes@yahoo.com', 'Purok 2', '045 Mabini Extension', 'Annual renewal of Reyes Variety & General Merchandise store', true, 'Under Review', 'Verifying location sketch and barangay tax clearance records.', NULL, '2026-09-30', NULL, 'a0000000-0000-0000-0000-000000000003', '2026-09-28 09:10:00+08'),

('BC-2026-0928-1005', 's0000000-0000-0000-0000-000000000003', 'BC-RES-00106', 'Lourdes', 'Morales', 'Tan', NULL, '0908-678-9012', 'lourdes.tan@student.edu.ph', 'Purok 5', '012 Riverside Drive', 'Scholarship requirement for 1st Semester Academic Year 2026-2027', true, 'Submitted', 'New application received via online portal.', NULL, '2026-09-30', NULL, NULL, '2026-09-28 11:22:00+08'),

('BC-2026-0928-1006', 's0000000-0000-0000-0000-000000000001', 'BC-RES-00107', 'Ramon', 'Ignacio', 'Fernandez', NULL, '0945-789-0123', 'ramon.f@outlook.com', 'Purok 6', '167 Coastal Road', 'Passport application requirement', false, 'For Correction', 'Uploaded Government ID is expired (validity 2023). Please re-upload updated valid ID.', NULL, '2026-10-02', NULL, 'a0000000-0000-0000-0000-000000000005', '2026-09-28 13:05:00+08')
ON CONFLICT (tracking_number) DO NOTHING;

-- 7. SEED APPOINTMENTS
INSERT INTO appointments (appointment_number, request_tracking_number, full_name, contact_number, service_name, scheduled_date, time_slot, status, purpose) VALUES
('APT-2026-0928-01', 'BC-2026-0928-1002', 'Danilo Perez Garcia', '0919-567-8901', 'Certificate of Indigency', '2026-09-29', '09:00 AM - 10:00 AM', 'Scheduled', 'In-person claim and dry-seal stamping at Desk 2'),
('APT-2026-0928-02', 'BC-2026-0928-1004', 'Eduardo Alvarez Reyes Jr.', '0920-345-6789', 'Barangay Business Clearance', '2026-09-29', '10:30 AM - 11:30 AM', 'Scheduled', 'Physical site inspection assessment payment'),
('APT-2026-0928-03', NULL, 'Felipe Gomez Mendoza', '0918-999-1122', 'Lupon Mediation Hearing', '2026-09-29', '02:00 PM - 03:30 PM', 'Scheduled', 'Preliminary boundary conciliation conference')
ON CONFLICT (appointment_number) DO NOTHING;

-- 8. SEED COMPLAINTS / CONCERNS
INSERT INTO complaints (ticket_number, complainant_name, complainant_contact, complainant_purok, is_anonymous, category, incident_date, incident_location, description, status, mediation_scheduled_at, resolution_notes, assigned_officer) VALUES
('BLOT-2026-0038', 'Confidential Resident', '0918-777-4433', 'Purok 3', true, 'Noise Disturbance', '2026-09-26', 'Near Purok 3 Basketball Court', 'Excessive videoke volume past 11:00 PM on weekdays in violation of Municipal Ordinance.', 'Under Investigation', NULL, 'Tanod night patrol dispatched for verbal warning.', 'Hon. Maria Clara Santos'),
('BLOT-2026-0039', 'Nestor Villanueva', '0921-888-2211', 'Purok 5', false, 'Property & Drainage Dispute', '2026-09-25', 'Boundary along Lot 14 & Lot 15, Purok 5', 'Neighbor blocked drainage canal resulting in rainwater overflow onto complainant garden.', 'Mediation Scheduled', '2026-09-30 14:00:00+08', 'Both parties summoned for Lupon Tagapamayapa session.', 'Hon. Rodrigo M. Castillo'),
('BLOT-2026-0037', 'Elena Ramos', '0917-000-1122', 'Purok 1', false, 'Stray Animals / Pet Safety', '2026-09-20', 'Rizal St. corner Purok 1 Alley', 'Unattended dogs chasing cyclists along the main barangay road.', 'Resolved', NULL, 'Pet owner warned and agreed to secure gate. Tanod verified compliance.', 'Desk Clerk Mendoza')
ON CONFLICT (ticket_number) DO NOTHING;

-- 9. SEED ANNOUNCEMENTS
INSERT INTO announcements (id, title, category, content, priority, target_audience, is_published, published_at, author_name) VALUES
('n0000000-0000-0000-0000-000000000001', 'Notice of Barangay General Assembly - 2nd Semester 2026', 'General Assembly', 'To all residents of Barangay Camohaguin, you are cordially invited to attend our 2nd Semester General Assembly on Saturday, October 10, 2026, 8:00 AM at the Camohaguin Covered Court. Agenda includes State of Barangay Address (SOBA), Annual Budget Presentation, and Community Open Forum.', 'Urgent', 'All Residents & Household Heads', true, '2026-09-26 08:00:00+08', 'Hon. Rodrigo M. Castillo'),
('n0000000-0000-0000-0000-000000000002', 'Free Anti-Rabies Vaccination for Dogs & Cats', 'Health & Wellness', 'The Barangay Veterinary Health Committee in coordination with the Gumaca Municipal Agriculture Office will conduct free pet anti-rabies vaccination on October 3 to 4, 2026 at the Barangay Health Station from 8:30 AM to 3:00 PM.', 'Normal', 'Pet Owners', true, '2026-09-25 10:00:00+08', 'Barangay Health Center'),
('n0000000-0000-0000-0000-000000000003', 'Schedule of Free Solid Waste & Segregated Garbage Collection', 'Sanitation & Environment', 'Please be reminded of the updated garbage collection schedule: Purok 1 to 3: Mondays & Thursdays (Biodegradable); Purok 4 to 7: Tuesdays & Fridays (Non-Biodegradable). Recyclables can be surrendered at the MRF every Saturday.', 'Advisory', 'All Puroks', true, '2026-09-22 09:30:00+08', 'Committee on Environment');

-- 10. SEED PUBLIC DOCUMENTS
INSERT INTO public_documents (title, category, reference_number, fiscal_year, description, file_url, published_at) VALUES
('Barangay Ordinance No. 04-2026: Regulation of Videoke and Loud Sound Systems', 'Barangay Ordinance', 'ORD-2026-004', 2026, 'Enacting curfew hours on videoke equipment between 10:00 PM and 6:00 AM to preserve neighborhood peace.', '/docs/ordinance-2026-004.pdf', '2026-05-15'),
('Barangay Resolution No. 12-2026: Authorizing Barangay Disaster Risk Reduction Plan', 'Resolution', 'RES-2026-012', 2026, 'Adoption of the 2026-2028 Comprehensive Barangay Disaster Risk Reduction and Management Plan.', '/docs/resolution-2026-012.pdf', '2026-03-10'),
('Annual Barangay Budget and Financial Transparency Report FY 2026', 'Annual Budget Report', 'FIN-2026-001', 2026, 'Full public disclosure of internal revenue allotment (IRA/NTA) allocation, 20% development fund, and SK fund.', '/docs/budget-fy2026.pdf', '2026-01-20');

-- 11. SEED PROJECTS
INSERT INTO projects (title, description, purok_location, budget_allocated, status, start_date, target_completion_date, person_in_charge) VALUES
('Concreting of Purok 3 to Purok 5 Farm-to-Market Feeder Road', 'Upgrading of 450-meter agricultural access road with box culvert drainage to facilitate produce transport.', 'Purok 3 & Purok 5', 850000.00, 'Ongoing', '2026-07-01', '2026-11-30', 'Kagawad on Infrastructure'),
('Solar Streetlight Installation Project - Phase II', 'Installation of 35 heavy-duty solar LED streetlights along dark sections of Coastal Road and Hilltop access.', 'Purok 6 & Purok 7', 380000.00, 'Ongoing', '2026-08-15', '2026-10-15', 'Barangay Peace & Order Tanod Chief'),
('Renovation and Equipment Upgrade of Barangay Health Station', 'Procurement of emergency oxygen concentrator, infant weighing scales, and refurbishment of consultation room.', 'Purok 1 (Sentro)', 220000.00, 'Completed', '2026-02-01', '2026-05-30', 'BHW Head Supervisor');

-- 12. SEED AUDIT LOGS
INSERT INTO audit_logs (user_id, actor_name, action, entity_type, entity_id, details, ip_address) VALUES
('a0000000-0000-0000-0000-000000000002', 'Elena S. Ramos', 'CREATE_REQUEST', 'service_requests', 'BC-2026-0928-1005', '{"source": "Online Portal", "applicant": "Lourdes Morales Tan", "service": "Certificate of Residency"}', '192.168.1.10'),
('a0000000-0000-0000-0000-000000000002', 'Elena S. Ramos', 'UPDATE_REQUEST_STATUS', 'service_requests', 'BC-2026-0928-1003', '{"old_status": "Under Review", "new_status": "Approved", "service": "First-Time Jobseeker Assistance"}', '192.168.1.10'),
('a0000000-0000-0000-0000-000000000002', 'Elena S. Ramos', 'VERIFY_RESIDENCY', 'residents', 'BC-RES-00104', '{"verified": true, "resident_id": "BC-RES-00104", "verifier": "Elena S. Ramos"}', '192.168.1.10'),
('a0000000-0000-0000-0000-000000000005', 'Jasmine P. Mendoza', 'MARK_FOR_CORRECTION', 'service_requests', 'BC-2026-0928-1006', '{"reason": "Uploaded Government ID is expired"}', '192.168.1.15');
