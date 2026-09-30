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

// Citizen Auth Modal
import { CitizenAuthModal } from './components/auth/CitizenAuthModal';

// Admin Pages (Hidden internally, separate app target)
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
import { usePublicServices, usePublicAnnouncements } from './hooks/useBarangayQueries';

export default function App() {
  // Public citizen portal by default (admin choices removed from public UI)
  const [portal, setPortal] = useState<'resident' | 'admin'>('resident');
  const [activeResidentTab, setActiveResidentTab] = useState<string>('home');
  const [activeAdminTab, setActiveAdminTab] = useState<string>('dashboard');

  // Citizen Authentication State
  const [currentCitizen, setCurrentCitizen] = useState<Resident | null>(() => BarangayDatabase.getCurrentCitizen());
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [pendingServiceToApply, setPendingServiceToApply] = useState<BarangayService | null>(null);

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

  // TanStack Query for public services and announcements
  const { data: queriedServices } = usePublicServices();
  const { data: queriedAnnouncements } = usePublicAnnouncements(10);

  // Sync TanStack Query cached data into active view
  useEffect(() => {
    if (queriedServices && queriedServices.length > 0) {
      setServices(queriedServices);
    }
  }, [queriedServices]);

  useEffect(() => {
    if (queriedAnnouncements && queriedAnnouncements.length > 0) {
      setAnnouncements(queriedAnnouncements);
    }
  }, [queriedAnnouncements]);

  // Check URL parameters for internal admin preview (?portal=admin or ?admin=true)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('portal') === 'admin' || params.get('admin') === 'true') {
      setPortal('admin');
    }
  }, []);

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
    setCurrentCitizen(BarangayDatabase.getCurrentCitizen());
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleOpenTrackRequest = (trackingNo?: string) => {
    if (trackingNo) {
      setTrackTargetNumber(trackingNo);
    }
    setActiveResidentTab('track');
  };

  // Intercept service application: require login/account
  const handleSelectService = (svc: BarangayService) => {
    if (!currentCitizen) {
      setPendingServiceToApply(svc);
      setAuthModalTab('login');
      setShowAuthModal(true);
    } else {
      setApplyingService(svc);
    }
  };

  // Intercept navigation tabs if needed (e.g. My Requests)
  const handleNavigateTab = (tab: string) => {
    if (tab === 'my-requests' && !currentCitizen) {
      setAuthModalTab('login');
      setShowAuthModal(true);
      return;
    }
    setActiveResidentTab(tab);
  };

  // When citizen successfully logs in or creates account
  const handleCitizenAuthSuccess = (resident: Resident) => {
    setCurrentCitizen(resident);
    setShowAuthModal(false);

    // If citizen was trying to apply for a service, proceed directly!
    if (pendingServiceToApply) {
      const targetService = pendingServiceToApply;
      setPendingServiceToApply(null);
      setApplyingService(targetService);
    }
  };

  const handleLogoutCitizen = () => {
    BarangayDatabase.logoutCitizen();
    setCurrentCitizen(null);
    if (activeResidentTab === 'my-requests') {
      setActiveResidentTab('home');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-amber-300 selection:text-emerald-950 font-sans">
      {/* Navigation Header (Citizen focused, no portal switcher) */}
      <Navbar
        activeResidentTab={activeResidentTab}
        setActiveResidentTab={handleNavigateTab}
        currentCitizen={currentCitizen}
        onOpenAuthModal={(tab = 'login') => {
          setAuthModalTab(tab);
          setShowAuthModal(true);
        }}
        onLogoutCitizen={handleLogoutCitizen}
        isInternalAdminMode={portal === 'admin'}
        onExitInternalAdmin={() => setPortal('resident')}
      />

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {portal === 'resident' ? (
          <div>
            {activeResidentTab === 'home' && (
              <ResidentHome
                onNavigate={handleNavigateTab}
                onSelectService={handleSelectService}
                services={services}
                announcements={announcements}
                onOpenTrackRequest={handleOpenTrackRequest}
              />
            )}

            {activeResidentTab === 'services' && (
              <ServicesList
                services={services}
                onSelectService={handleSelectService}
                onViewDetails={svc => setDetailService(svc)}
              />
            )}

            {activeResidentTab === 'track' && (
              <TrackRequest
                initialTracking={trackTargetNumber}
                onOpenMyRequests={() => handleNavigateTab('my-requests')}
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
          /* Internal staff mode (kept intact for future separated application) */
          <div>
            <div className="mb-4 bg-amber-50 border border-amber-300 text-amber-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between">
              <span><strong>Internal Barangay Staff Mode</strong> — This view will be migrated into the separate internal barangay app.</span>
              <button
                onClick={() => setPortal('resident')}
                className="bg-amber-400 hover:bg-amber-500 text-emerald-950 font-bold px-3 py-1 rounded text-xs transition"
              >
                Back to Public Citizen Portal
              </button>
            </div>

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
            handleSelectService(svc);
          }}
        />
      )}

      {applyingService && (
        <SubmitRequestModal
          service={applyingService}
          currentCitizen={currentCitizen}
          onClose={() => setApplyingService(null)}
          onSuccess={newReq => {
            refreshAllData();
          }}
        />
      )}

      {/* Citizen Login & Registration Modal */}
      <CitizenAuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingServiceToApply(null);
        }}
        onSuccess={handleCitizenAuthSuccess}
        pendingService={pendingServiceToApply}
        initialTab={authModalTab}
      />

      {/* AI Helpdesk Chatbot (Available for all citizens & visitors) */}
      <GeminiChatbot />

      {/* Site Footer */}
      <Footer onOpenInternalStaff={() => setPortal('admin')} />
    </div>
  );
}
