import React from 'react';
import {
  FileText,
  Calendar,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Building,
  UserCheck
} from 'lucide-react';
import {
  AdminUser,
  Appointment,
  AuditLog,
  Complaint,
  Resident,
  ServiceRequest
} from '../../types/schema';

interface AdminDashboardProps {
  requests: ServiceRequest[];
  residents: Resident[];
  appointments: Appointment[];
  complaints: Complaint[];
  auditLogs: AuditLog[];
  activeAdmin: AdminUser;
  onNavigate: (tab: string) => void;
  onSelectRequest: (request: ServiceRequest) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  requests,
  residents,
  appointments,
  complaints,
  auditLogs,
  activeAdmin,
  onNavigate,
  onSelectRequest,
}) => {
  const pendingRequests = requests.filter(
    r => r.status === 'Submitted' || r.status === 'Under Review' || r.status === 'For Correction'
  );
  const readyRequests = requests.filter(r => r.status === 'Ready for Release');
  const todayAppointments = appointments.filter(a => a.status === 'Scheduled');
  const openComplaints = complaints.filter(c => c.status === 'Open' || c.status === 'Under Investigation' || c.status === 'Mediation Scheduled');
  const verifiedResidentsCount = residents.filter(r => r.residency_status === 'verified').length;

  const recentPendingRequests = pendingRequests.slice(0, 5);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-emerald-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Barangay Administration Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif">
            Welcome back, {activeAdmin.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1">
            Logged in as <strong>{activeAdmin.role}</strong> ({activeAdmin.department}).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate('requests')}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5"
          >
            <span>Review Pending Requests</span>
            <span className="bg-emerald-950 text-amber-300 px-1.5 py-0.2 rounded-full text-[10px]">
              {pendingRequests.length}
            </span>
          </button>
          <button
            onClick={() => onNavigate('residents')}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition border border-emerald-600"
          >
            Registry Lookup
          </button>
        </div>
      </div>

      {/* 4 Prioritized Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Requests */}
        <div
          onClick={() => onNavigate('requests')}
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-emerald-600 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pending Requests
              </span>
              <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono">
              {pendingRequests.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {requests.filter(r => r.status === 'Submitted').length} new submitted • {readyRequests.length} ready for release
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-amber-800 flex items-center gap-1">
            Open Queue <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        {/* Card 2: Today's Appointments */}
        <div
          onClick={() => onNavigate('appointments')}
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-emerald-600 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Appointments
              </span>
              <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono">
              {todayAppointments.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Desk consultations and mediation appearances scheduled
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-blue-800 flex items-center gap-1">
            View Schedule <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        {/* Card 3: Open Concerns / Lupon */}
        <div
          onClick={() => onNavigate('complaints')}
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-emerald-600 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Open Concerns
              </span>
              <div className="p-2 rounded-lg bg-red-100 text-red-700">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono">
              {openComplaints.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active neighborhood disputes & blotter tickets
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-red-700 flex items-center gap-1">
            Lupon Mediation <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        {/* Card 4: Verified Residents */}
        <div
          onClick={() => onNavigate('residents')}
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-emerald-600 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Resident Registry
              </span>
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono">
              {verifiedResidentsCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Verified resident profiles across 7 Puroks
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-emerald-800 flex items-center gap-1">
            View Registry <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Main Content Grid: Pending Requests & Recent Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Priority Action Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-serif text-slate-900">
                Pending Service Applications Queue
              </h2>
              <p className="text-xs text-slate-500">Requires evaluation, clearance verification, or document release.</p>
            </div>
            <button
              onClick={() => onNavigate('requests')}
              className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
            >
              All Requests ({requests.length}) <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {recentPendingRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No pending requests requiring action right now. All caught up!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentPendingRequests.map(req => (
                  <div
                    key={req.tracking_number}
                    className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                          {req.tracking_number}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            req.status === 'Submitted'
                              ? 'bg-blue-100 text-blue-900'
                              : req.status === 'Under Review'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-orange-100 text-orange-900'
                          }`}
                        >
                          {req.status}
                        </span>
                        {req.residency_verified ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Verified Resident
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                            Unverified
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-slate-900">{req.service_name}</h4>
                      <p className="text-xs text-slate-500">
                        Applicant: <strong>{req.applicant_first_name} {req.applicant_last_name}</strong> • {req.purok_zone} • Submitted: {new Date(req.created_at).toLocaleDateString('en-PH')}
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectRequest(req)}
                      className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-semibold text-xs rounded-lg transition whitespace-nowrap shadow-2xs"
                    >
                      Process & Update
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Recent Audit Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-serif text-slate-900">
              Recent Staff Activity
            </h2>
            <button
              onClick={() => onNavigate('audit-logs')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Full Trail
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            {auditLogs.slice(0, 6).map(log => (
              <div key={log.id} className="text-xs border-b border-slate-100 last:border-0 pb-2.5 last:pb-0 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{log.actor_name}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-emerald-800 font-semibold">
                  {log.action}
                </div>
                <div className="text-slate-500 text-[11px] truncate">
                  Target: {log.entity_id} {log.details ? `• ${JSON.stringify(log.details).slice(0, 45)}...` : ''}
                </div>
              </div>
            ))}
          </div>

          {/* Barangay Hall Snapshot */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
            <span className="font-bold text-slate-900 block uppercase tracking-wider text-[11px]">
              Barangay Operating Hours
            </span>
            <p>Frontline Public Desk: <strong>8:00 AM - 5:00 PM</strong></p>
            <p>Peace & Order Tanod Desk: <strong>24 Hours Stationed</strong></p>
            <p className="text-[11px] text-slate-400">
              System ID: <code className="font-mono text-emerald-700">CAMOHAGUIN-LGU-4307</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
