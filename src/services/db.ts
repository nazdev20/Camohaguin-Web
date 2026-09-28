import {
  AdminUser,
  Announcement,
  Appointment,
  AuditLog,
  BarangayService,
  Complaint,
  Household,
  Project,
  PublicDocument,
  RequestStatus,
  Resident,
  ServiceRequest,
} from '../types/schema';
import {
  INITIAL_ADMINS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_COMPLAINTS,
  INITIAL_HOUSEHOLDS,
  INITIAL_PROJECTS,
  INITIAL_PUBLIC_DOCUMENTS,
  INITIAL_RESIDENTS,
  INITIAL_SERVICE_REQUESTS,
  INITIAL_SERVICES,
} from './mockData';

const STORAGE_KEYS = {
  RESIDENTS: 'bc_residents_v1',
  HOUSEHOLDS: 'bc_households_v1',
  SERVICES: 'bc_services_v1',
  REQUESTS: 'bc_requests_v1',
  APPOINTMENTS: 'bc_appointments_v1',
  COMPLAINTS: 'bc_complaints_v1',
  ANNOUNCEMENTS: 'bc_announcements_v1',
  DOCUMENTS: 'bc_documents_v1',
  PROJECTS: 'bc_projects_v1',
  ADMINS: 'bc_admins_v1',
  AUDIT_LOGS: 'bc_audit_logs_v1',
  ACTIVE_ADMIN: 'bc_active_admin_v1',
};

function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Error reading localStorage for ${key}:`, e);
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving localStorage for ${key}:`, e);
  }
}

export class BarangayDatabase {
  // --- Admin Session / Actor ---
  static getActiveAdmin(): AdminUser {
    const admins = this.getAdmins();
    const stored = getStorage<AdminUser | null>(STORAGE_KEYS.ACTIVE_ADMIN, null);
    if (stored && admins.some(a => a.id === stored.id)) {
      return stored;
    }
    const defaultAdmin = admins[1] || admins[0]; // Elena S. Ramos (Secretary)
    this.setActiveAdmin(defaultAdmin);
    return defaultAdmin;
  }

  static setActiveAdmin(admin: AdminUser): void {
    setStorage(STORAGE_KEYS.ACTIVE_ADMIN, admin);
  }

  static getAdmins(): AdminUser[] {
    return getStorage<AdminUser[]>(STORAGE_KEYS.ADMINS, INITIAL_ADMINS);
  }

  // --- Audit Logs ---
  static getAuditLogs(): AuditLog[] {
    return getStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  static addAuditLog(
    action: string,
    entityType: string,
    entityId: string,
    details?: Record<string, any>,
    actor?: string
  ): void {
    const logs = this.getAuditLogs();
    const currentAdmin = this.getActiveAdmin();
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: currentAdmin.id,
      actor_name: actor || currentAdmin.full_name,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      ip_address: '127.0.0.1 (Web Portal)',
      created_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    setStorage(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 200)); // Cap to 200 logs
  }

  // --- Households ---
  static getHouseholds(): Household[] {
    return getStorage<Household[]>(STORAGE_KEYS.HOUSEHOLDS, INITIAL_HOUSEHOLDS);
  }

  // --- Residents (Privileged Admin Access Only) ---
  static getResidents(): Resident[] {
    return getStorage<Resident[]>(STORAGE_KEYS.RESIDENTS, INITIAL_RESIDENTS);
  }

  static getResidentById(residentId: string): Resident | undefined {
    return this.getResidents().find(r => r.resident_id === residentId);
  }

  static updateResidentStatus(residentId: string, status: Resident['residency_status'], remarks?: string): boolean {
    const residents = this.getResidents();
    const index = residents.findIndex(r => r.resident_id === residentId);
    if (index === -1) return false;

    const oldStatus = residents[index].residency_status;
    const admin = this.getActiveAdmin();

    residents[index] = {
      ...residents[index],
      residency_status: status,
      verified_at: status === 'verified' ? new Date().toISOString() : residents[index].verified_at,
      verified_by_user_id: status === 'verified' ? admin.id : residents[index].verified_by_user_id,
      remarks: remarks || residents[index].remarks,
      updated_at: new Date().toISOString(),
    };

    setStorage(STORAGE_KEYS.RESIDENTS, residents);
    this.addAuditLog('UPDATE_RESIDENCY_STATUS', 'residents', residentId, {
      old_status: oldStatus,
      new_status: status,
      remarks,
    });
    return true;
  }

  // --- Services ---
  static getServices(): BarangayService[] {
    return getStorage<BarangayService[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  }

  static getServiceById(id: string): BarangayService | undefined {
    return this.getServices().find(s => s.id === id);
  }

  static saveService(service: BarangayService): void {
    const services = this.getServices();
    const index = services.findIndex(s => s.id === service.id);
    if (index >= 0) {
      services[index] = { ...service, updated_at: new Date().toISOString() };
      this.addAuditLog('UPDATE_SERVICE', 'services', service.id, { name: service.name });
    } else {
      services.push({ ...service, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      this.addAuditLog('CREATE_SERVICE', 'services', service.id, { name: service.name });
    }
    setStorage(STORAGE_KEYS.SERVICES, services);
  }

  // --- Service Requests ---
  static getRequests(): ServiceRequest[] {
    return getStorage<ServiceRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_SERVICE_REQUESTS);
  }

  static getRequestByTracking(trackingNumber: string): ServiceRequest | undefined {
    return this.getRequests().find(r => r.tracking_number.toUpperCase().trim() === trackingNumber.toUpperCase().trim());
  }

  static createRequest(data: Omit<ServiceRequest, 'tracking_number' | 'created_at' | 'updated_at'>): ServiceRequest {
    const requests = this.getRequests();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const tracking_number = `BC-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${randomSuffix}`;

    const newRequest: ServiceRequest = {
      ...data,
      tracking_number,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    requests.unshift(newRequest);
    setStorage(STORAGE_KEYS.REQUESTS, requests);

    this.addAuditLog(
      'CREATE_SERVICE_REQUEST',
      'service_requests',
      tracking_number,
      {
        applicant: `${newRequest.applicant_first_name} ${newRequest.applicant_last_name}`,
        service: newRequest.service_name,
        residency_verified: newRequest.residency_verified,
      },
      `${newRequest.applicant_first_name} ${newRequest.applicant_last_name} (Resident Portal)`
    );

    return newRequest;
  }

  static updateRequestStatus(
    trackingNumber: string,
    status: RequestStatus,
    adminRemarks?: string,
    targetReleaseDate?: string,
    rejectionReason?: string
  ): boolean {
    const requests = this.getRequests();
    const index = requests.findIndex(r => r.tracking_number === trackingNumber);
    if (index === -1) return false;

    const currentAdmin = this.getActiveAdmin();
    const prev = requests[index];

    requests[index] = {
      ...prev,
      status,
      admin_remarks: adminRemarks !== undefined ? adminRemarks : prev.admin_remarks,
      rejection_reason: status === 'Rejected' ? (rejectionReason || prev.rejection_reason) : undefined,
      target_release_date: targetReleaseDate || prev.target_release_date,
      actual_released_at: status === 'Completed' ? new Date().toISOString() : prev.actual_released_at,
      reviewed_by_user_id: currentAdmin.id,
      reviewed_by_name: currentAdmin.full_name,
      updated_at: new Date().toISOString(),
    };

    setStorage(STORAGE_KEYS.REQUESTS, requests);

    this.addAuditLog('UPDATE_REQUEST_STATUS', 'service_requests', trackingNumber, {
      previous_status: prev.status,
      new_status: status,
      remarks: adminRemarks,
    });

    return true;
  }

  // --- Appointments ---
  static getAppointments(): Appointment[] {
    return getStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
  }

  static updateAppointmentStatus(id: string, status: Appointment['status'], notes?: string): void {
    const list = this.getAppointments();
    const idx = list.findIndex(a => a.id === id);
    if (idx >= 0) {
      list[idx].status = status;
      if (notes) list[idx].notes = notes;
      list[idx].updated_at = new Date().toISOString();
      setStorage(STORAGE_KEYS.APPOINTMENTS, list);
      this.addAuditLog('UPDATE_APPOINTMENT_STATUS', 'appointments', id, { status });
    }
  }

  // --- Complaints / Concerns ---
  static getComplaints(): Complaint[] {
    return getStorage<Complaint[]>(STORAGE_KEYS.COMPLAINTS, INITIAL_COMPLAINTS);
  }

  static createComplaint(data: Omit<Complaint, 'id' | 'ticket_number' | 'created_at' | 'updated_at'>): Complaint {
    const list = this.getComplaints();
    const randomTicket = `BLOT-${new Date().getFullYear()}-${String(list.length + 40).padStart(4, '0')}`;
    const newComplaint: Complaint = {
      ...data,
      id: `comp-${Date.now()}`,
      ticket_number: randomTicket,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newComplaint);
    setStorage(STORAGE_KEYS.COMPLAINTS, list);
    this.addAuditLog('FILE_COMPLAINT', 'complaints', randomTicket, { category: newComplaint.category });
    return newComplaint;
  }

  static updateComplaintStatus(
    id: string,
    status: Complaint['status'],
    resolutionNotes?: string,
    assignedOfficer?: string
  ): void {
    const list = this.getComplaints();
    const idx = list.findIndex(c => c.id === id);
    if (idx >= 0) {
      list[idx].status = status;
      if (resolutionNotes) list[idx].resolution_notes = resolutionNotes;
      if (assignedOfficer) list[idx].assigned_officer = assignedOfficer;
      list[idx].updated_at = new Date().toISOString();
      setStorage(STORAGE_KEYS.COMPLAINTS, list);
      this.addAuditLog('UPDATE_COMPLAINT_STATUS', 'complaints', list[idx].ticket_number, { status });
    }
  }

  // --- Announcements ---
  static getAnnouncements(): Announcement[] {
    return getStorage<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  }

  static saveAnnouncement(announcement: Announcement): void {
    const list = this.getAnnouncements();
    const idx = list.findIndex(a => a.id === announcement.id);
    if (idx >= 0) {
      list[idx] = { ...announcement, updated_at: new Date().toISOString() };
      this.addAuditLog('UPDATE_ANNOUNCEMENT', 'announcements', announcement.id, { title: announcement.title });
    } else {
      list.unshift({ ...announcement, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      this.addAuditLog('CREATE_ANNOUNCEMENT', 'announcements', announcement.id, { title: announcement.title });
    }
    setStorage(STORAGE_KEYS.ANNOUNCEMENTS, list);
  }

  // --- Public Documents ---
  static getPublicDocuments(): PublicDocument[] {
    return getStorage<PublicDocument[]>(STORAGE_KEYS.DOCUMENTS, INITIAL_PUBLIC_DOCUMENTS);
  }

  // --- Projects ---
  static getProjects(): Project[] {
    return getStorage<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  }

  // Reset demo data helper
  static resetToDefaultData(): void {
    localStorage.removeItem(STORAGE_KEYS.RESIDENTS);
    localStorage.removeItem(STORAGE_KEYS.HOUSEHOLDS);
    localStorage.removeItem(STORAGE_KEYS.SERVICES);
    localStorage.removeItem(STORAGE_KEYS.REQUESTS);
    localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
    localStorage.removeItem(STORAGE_KEYS.COMPLAINTS);
    localStorage.removeItem(STORAGE_KEYS.ANNOUNCEMENTS);
    localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.ADMINS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ADMIN);
  }
}
