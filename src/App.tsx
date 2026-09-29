/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BarangayDatabase } from './services/db';
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
  Resident,
  ServiceRequest,
} from './types/schema';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Resident Pages & Modals
import { ResidentHome } from './components/resident/ResidentHome';
import { ServicesList } from './components/resident/ServicesList';
import { ServiceDetailModal } from './components/resident/ServiceDetailModal';
import { SubmitRequestModal } from './components/resident/SubmitRequestModal';
import { TrackRequest } from './components/resident/TrackRequest';
import { MyRequests } from './components/resident/MyRequests';
import { ResidentVerificationCheck } from './components/resident/ResidentVerificationCheck';
import { AnnouncementsView } from './components/resident/AnnouncementsView';
import { BarangayInfo } from './components/resident/BarangayInfo';
import { EmergencyContacts } from './components/resident/EmergencyContacts';

// Admin Pages
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminServiceRequests } from './components/admin/AdminServiceRequests';
import { AdminResidents } from './components/admin/AdminResidents';
import { AdminAppointments } from './components/admin/AdminAppointments';
import { AdminComplaints } from './components/admin/AdminComplaints';
import { AdminServices } from './components/admin/AdminServices';
import { AdminAnnouncements } from './components/admin/AdminAnnouncements';
import { AdminDocumentsProjects } from './components/admin/AdminDocumentsProjects';
import { AdminAuditLogs } from './components/admin/AdminAuditLogs';
import { GeminiChatbot } from './components/GeminiChatbot';

export default function App() {
  const [portal, setPortal] = useState<'resident' | 'admin'>('resident');
  const [activeResidentTab, setActiveResidentTab] = useState<string>('home');
  const [activeAdminTab, setActiveAdminTab] = useState<string>('dashboard');

  // Database in-memory / storage sync states
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [activeAdmin, setActiveAdmin] = useState<AdminUser>(BarangayDatabase.getActiveAdmin());
  const [residents, setResidents] = useState<Resident[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [services, setServices] = useState<BarangayService[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [publicDocs, setPublicDocs] = useState<PublicDocument[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modals and routing cross-references
  const [detailService, setDetailService] = useState<BarangayService | null>(null);
  const [applyingService, setApplyingService] = useState<BarangayService | null>(null);
  const [trackTargetNumber, setTrackTargetNumber] = useState<string>('');
  const [dashboardSelectedRequest, setDashboardSelectedRequest] = useState<ServiceRequest | null>(null);

  const refreshAllData = () => {
    setAdminsList(BarangayDatabase.getAdmins());
    setActiveAdmin(BarangayDatabase.getActiveAdmin());
    setResidents(BarangayDatabase.getResidents());
    setHouseholds(BarangayDatabase.getHouseholds());
    setServices(BarangayDatabase.getServices());
    setRequests(BarangayDatabase.getRequests());
    setAppointments(BarangayDatabase.getAppointments());
    setComplaints(BarangayDatabase.getComplaints());
    setAnnouncements(BarangayDatabase.getAnnouncements());
    setPublicDocs(BarangayDatabase.getPublicDocuments());
    setProjects(BarangayDatabase.getProjects());
    setAuditLogs(BarangayDatabase.getAuditLogs());
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleSwitchAdmin = (newAdmin: AdminUser) => {
    BarangayDatabase.setActiveAdmin(newAdmin);
    setActiveAdmin(newAdmin);
  };

  const handleOpenTrackRequest = (trackingNo?: string) => {
    if (trackingNo) {
      setTrackTargetNumber(trackingNo);
    }
    setActiveResidentTab('track');
  };

  const pendingRequestsCount = requests.filter(
    r => r.status === 'Submitted' || r.status === 'Under Review' || r.status === 'For Correction'
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-amber-300 selection:text-emerald-950 font-sans">
      {/* Navigation Header */}
      <Navbar
        portal={portal}
        setPortal={setPortal}
        activeResidentTab={activeResidentTab}
        setActiveResidentTab={setActiveResidentTab}
        activeAdminTab={activeAdminTab}
        setActiveAdminTab={setActiveAdminTab}
        activeAdmin={activeAdmin}
        onSwitchAdmin={handleSwitchAdmin}
        adminsList={adminsList}
        pendingRequestsCount={pendingRequestsCount}
      />

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {portal === 'resident' ? (
          <div>
            {activeResidentTab === 'home' && (
              <ResidentHome
                onNavigate={setActiveResidentTab}
                onSelectService={svc => setApplyingService(svc)}
                services={services}
                announcements={announcements}
                onOpenTrackRequest={handleOpenTrackRequest}
              />
            )}

            {activeResidentTab === 'services' && (
              <ServicesList
                services={services}
                onSelectService={svc => setApplyingService(svc)}
                onViewDetails={svc => setDetailService(svc)}
              />
            )}

            {activeResidentTab === 'track' && (
              <TrackRequest
                initialTracking={trackTargetNumber}
                onOpenMyRequests={() => setActiveResidentTab('my-requests')}
              />
            )}

            {activeResidentTab === 'my-requests' && (
              <MyRequests
                onSelectTrack={handleOpenTrackRequest}
                onApplyNew={() => setActiveResidentTab('services')}
              />
            )}

            {activeResidentTab === 'verify-residency' && (
              <ResidentVerificationCheck
                onApplyForService={() => setActiveResidentTab('services')}
              />
            )}

            {activeResidentTab === 'announcements' && (
              <AnnouncementsView announcements={announcements} />
            )}

            {activeResidentTab === 'info' && <BarangayInfo />}

            {activeResidentTab === 'emergency' && <EmergencyContacts />}
          </div>
        ) : (
          <div>
            {activeAdminTab === 'dashboard' && (
              <AdminDashboard
                requests={requests}
                residents={residents}
                appointments={appointments}
                complaints={complaints}
                auditLogs={auditLogs}
                activeAdmin={activeAdmin}
                onNavigate={setActiveAdminTab}
                onSelectRequest={req => {
                  setDashboardSelectedRequest(req);
                  setActiveAdminTab('requests');
                }}
              />
            )}

            {activeAdminTab === 'requests' && (
              <AdminServiceRequests
                requests={requests}
                onRefresh={refreshAllData}
                selectedRequestFromDashboard={dashboardSelectedRequest}
                onClearSelected={() => setDashboardSelectedRequest(null)}
              />
            )}

            {activeAdminTab === 'residents' && (
              <AdminResidents
                residents={residents}
                households={households}
                onRefresh={refreshAllData}
              />
            )}

            {activeAdminTab === 'appointments' && (
              <AdminAppointments
                appointments={appointments}
                onRefresh={refreshAllData}
              />
            )}

            {activeAdminTab === 'complaints' && (
              <AdminComplaints
                complaints={complaints}
                onRefresh={refreshAllData}
              />
            )}

            {activeAdminTab === 'services-mgmt' && (
              <AdminServices
                services={services}
                onRefresh={refreshAllData}
              />
            )}

            {activeAdminTab === 'announcements-mgmt' && (
              <AdminAnnouncements
                announcements={announcements}
                onRefresh={refreshAllData}
              />
            )}

            {activeAdminTab === 'documents-projects' && (
              <AdminDocumentsProjects
                documents={publicDocs}
                projects={projects}
              />
            )}

            {activeAdminTab === 'audit-logs' && (
              <AdminAuditLogs
                auditLogs={auditLogs}
                activeAdmin={activeAdmin}
                onRefresh={refreshAllData}
              />
            )}
          </div>
        )}
      </main>

      {/* Global Modals */}
      {detailService && (
        <ServiceDetailModal
          service={detailService}
          onClose={() => setDetailService(null)}
          onApply={svc => {
            setDetailService(null);
            setApplyingService(svc);
          }}
        />
      )}

      {applyingService && (
        <SubmitRequestModal
          service={applyingService}
          onClose={() => setApplyingService(null)}
          onSuccess={newReq => {
            refreshAllData();
          }}
        />
      )}

      {/* AI Helpdesk Chatbot */}
      <GeminiChatbot />

      {/* Site Footer */}
      <Footer />
    </div>
  );
}
