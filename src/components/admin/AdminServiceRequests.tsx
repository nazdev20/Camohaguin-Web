import React, { useState } from 'react';
import { BarangayDatabase } from '../../services/db';
import { RequestStatus, ServiceRequest } from '../../types/schema';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Eye,
  Check,
  Calendar,
  User,
  Printer,
  X,
  Edit3,
  ShieldCheck
} from 'lucide-react';

interface AdminServiceRequestsProps {
  requests: ServiceRequest[];
  onRefresh: () => void;
  selectedRequestFromDashboard?: ServiceRequest | null;
  onClearSelected?: () => void;
}

export const AdminServiceRequests: React.FC<AdminServiceRequestsProps> = ({
  requests,
  onRefresh,
  selectedRequestFromDashboard,
  onClearSelected,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [purokFilter, setPurokFilter] = useState<string>('All');

  // Update modal state
  const [activeModalRequest, setActiveModalRequest] = useState<ServiceRequest | null>(
    selectedRequestFromDashboard || null
  );

  // Form states in update modal
  const [newStatus, setNewStatus] = useState<RequestStatus>('Under Review');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [targetReleaseDate, setTargetReleaseDate] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync if dashboard passed a request
  React.useEffect(() => {
    if (selectedRequestFromDashboard) {
      openUpdateModal(selectedRequestFromDashboard);
    }
  }, [selectedRequestFromDashboard]);

  const openUpdateModal = (req: ServiceRequest) => {
    setActiveModalRequest(req);
    setNewStatus(req.status);
    setAdminRemarks(req.admin_remarks || '');
    setTargetReleaseDate(req.target_release_date || '');
    setRejectionReason(req.rejection_reason || '');
  };

  const handleSaveUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalRequest) return;

    setSaving(true);
    try {
      BarangayDatabase.updateRequestStatus(
        activeModalRequest.tracking_number,
        newStatus,
        adminRemarks,
        targetReleaseDate,
        newStatus === 'Rejected' ? rejectionReason : undefined
      );

      onRefresh();
      setActiveModalRequest(null);
      if (onClearSelected) onClearSelected();
    } finally {
      setSaving(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch =
      req.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${req.applicant_first_name} ${req.applicant_last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.service_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.purpose.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
    const matchesPurok = purokFilter === 'All' || req.purok_zone === purokFilter;

    return matchesSearch && matchesStatus && matchesPurok;
  });

  const allStatuses: RequestStatus[] = [
    'Submitted',
    'Under Review',
    'For Correction',
    'Approved',
    'Ready for Release',
    'Completed',
    'Rejected',
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
            Service Applications Management
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Review applicant documents, update review statuses, and record document releases.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by tracking number, applicant name, service..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white font-semibold text-slate-700"
          >
            <option value="All">All Statuses ({requests.length})</option>
            {allStatuses.map(st => (
              <option key={st} value={st}>
                {st} ({requests.filter(r => r.status === st).length})
              </option>
            ))}
          </select>

          {/* Purok Filter */}
          <select
            value={purokFilter}
            onChange={e => setPurokFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-slate-700"
          >
            <option value="All">All Puroks</option>
            <option value="Purok 1">Purok 1</option>
            <option value="Purok 2">Purok 2</option>
            <option value="Purok 3">Purok 3</option>
            <option value="Purok 4">Purok 4</option>
            <option value="Purok 5">Purok 5</option>
            <option value="Purok 6">Purok 6</option>
            <option value="Purok 7">Purok 7</option>
          </select>
        </div>
      </div>

      {/* Table of Requests */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Tracking No.</th>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Residency</th>
                <th className="py-3 px-4">Date Filed</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No service requests match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => (
                  <tr key={req.tracking_number} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {req.tracking_number}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {req.applicant_first_name} {req.applicant_middle_name || ''} {req.applicant_last_name} {req.applicant_suffix || ''}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {req.purok_zone} • {req.applicant_contact}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{req.service_name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{req.purpose}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {req.residency_verified ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{req.resident_id || 'Verified'}</span>
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">
                          Unverified
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(req.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          req.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-900'
                            : req.status === 'Ready for Release'
                            ? 'bg-teal-100 text-teal-900 font-black'
                            : req.status === 'Approved'
                            ? 'bg-blue-100 text-blue-900'
                            : req.status === 'For Correction'
                            ? 'bg-amber-100 text-amber-900'
                            : req.status === 'Rejected'
                            ? 'bg-red-100 text-red-900'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openUpdateModal(req)}
                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-bold text-xs rounded-lg transition inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Process</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process / Update Modal */}
      {activeModalRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-emerald-900 text-white p-5 relative flex justify-between items-start">
              <div>
                <span className="font-mono text-xs font-bold bg-emerald-800 text-amber-300 px-2 py-0.5 rounded border border-emerald-700">
                  {activeModalRequest.tracking_number}
                </span>
                <h2 className="text-lg sm:text-xl font-bold font-serif mt-1">
                  Process Application: {activeModalRequest.service_name}
                </h2>
                <p className="text-xs text-emerald-200">
                  Applicant: <strong>{activeModalRequest.applicant_first_name} {activeModalRequest.applicant_last_name}</strong> ({activeModalRequest.purok_zone})
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveModalRequest(null);
                  if (onClearSelected) onClearSelected();
                }}
                className="text-emerald-300 hover:text-white p-1 rounded-full hover:bg-emerald-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleSaveUpdate} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
              {/* Applicant Overview Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[10px]">Contact</span>
                  <span className="font-semibold text-slate-800">{activeModalRequest.applicant_contact}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[10px]">Address</span>
                  <span className="font-semibold text-slate-800">{activeModalRequest.address}, {activeModalRequest.purok_zone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[10px]">Residency</span>
                  <span className="font-bold">
                    {activeModalRequest.residency_verified ? (
                      <span className="text-emerald-700">Verified ({activeModalRequest.resident_id || 'Registry'})</span>
                    ) : (
                      <span className="text-slate-500">Unverified Record</span>
                    )}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-3 pt-1 border-t border-slate-200">
                  <span className="text-slate-400 block uppercase font-bold text-[10px]">Stated Purpose</span>
                  <span className="font-medium text-slate-700">{activeModalRequest.purpose}</span>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 uppercase tracking-wide">
                  Update Request Status *
                </label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as RequestStatus)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white font-bold text-slate-900"
                >
                  <option value="Submitted">Submitted (Initial Queue)</option>
                  <option value="Under Review">Under Review (Currently Assessing)</option>
                  <option value="For Correction">For Correction (Applicant Must Resubmit/Update)</option>
                  <option value="Approved">Approved (Ready for Printing & Dry-Seal)</option>
                  <option value="Ready for Release">Ready for Release (Waiting for In-Person Pickup)</option>
                  <option value="Completed">Completed (Signed & Document Released)</option>
                  <option value="Rejected">Rejected (Disapproved)</option>
                </select>
              </div>

              {/* Status specifics */}
              {newStatus === 'Rejected' && (
                <div>
                  <label className="block text-xs font-bold text-red-700 mb-1">
                    Disapproval / Rejection Reason *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Specify grounds for disapproval (e.g. Non-resident of barangay, fraudulent declaration, pending dispute)..."
                    className="w-full px-3 py-2 rounded-lg border border-red-300 focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
              )}

              {newStatus === 'For Correction' && (
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-900">
                  <span className="font-bold block mb-1">Correction Instructions for Applicant</span>
                  <p className="text-[11px] leading-relaxed">
                    The remarks you write below will appear directly on the resident's "Track Request" screen.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Release Date
                  </label>
                  <input
                    type="date"
                    value={targetReleaseDate}
                    onChange={e => setTargetReleaseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Administrative Remarks
                  </label>
                  <input
                    type="text"
                    value={adminRemarks}
                    onChange={e => setAdminRemarks(e.target.value)}
                    placeholder="e.g. Dry-sealed and forwarded to releasing desk window 1"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Document attachments preview */}
              <div>
                <span className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                  Submitted Requirements / Attachments
                </span>
                {activeModalRequest.documents && activeModalRequest.documents.length > 0 ? (
                  <div className="space-y-1.5">
                    {activeModalRequest.documents.map(doc => (
                      <div
                        key={doc.id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between"
                      >
                        <span className="font-semibold text-slate-800">{doc.document_name}</span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                          Uploaded
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No digital files uploaded. Verify physical ID upon release.</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModalRequest(null);
                      if (onClearSelected) onClearSelected();
                    }}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-bold rounded-lg transition shadow flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{saving ? 'Saving...' : 'Save & Update Status'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
