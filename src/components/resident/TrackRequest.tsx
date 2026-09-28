import React, { useState, useEffect } from 'react';
import { BarangayDatabase } from '../../services/db';
import { RequestStatus, ServiceRequest } from '../../types/schema';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  User,
  Calendar,
  Building2,
  Printer,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface TrackRequestProps {
  initialTracking?: string;
  onOpenMyRequests?: () => void;
}

export const TrackRequest: React.FC<TrackRequestProps> = ({
  initialTracking = '',
  onOpenMyRequests,
}) => {
  const [trackingNumber, setTrackingNumber] = useState(initialTracking);
  const [searchQuery, setSearchQuery] = useState(initialTracking);
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (initialTracking) {
      setTrackingNumber(initialTracking);
      setSearchQuery(initialTracking);
      handleSearch(initialTracking);
    }
  }, [initialTracking]);

  const handleSearch = (queryToUse?: string) => {
    const q = (queryToUse || searchQuery).trim().toUpperCase();
    if (!q) return;

    const found = BarangayDatabase.getRequestByTracking(q);
    if (found) {
      setRequest(found);
      setNotFound(false);
    } else {
      setRequest(null);
      setNotFound(true);
    }
  };

  // Status visual mapping
  const statusSteps: RequestStatus[] = [
    'Submitted',
    'Under Review',
    'Approved',
    'Ready for Release',
    'Completed',
  ];

  const getStepIndex = (status: RequestStatus): number => {
    switch (status) {
      case 'Submitted':
        return 0;
      case 'Under Review':
        return 1;
      case 'For Correction':
        return 1; // Stuck at review stage
      case 'Approved':
        return 2;
      case 'Rejected':
        return 2; // Ended at decision stage
      case 'Ready for Release':
        return 3;
      case 'Completed':
        return 4;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
          Track Service Application
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Monitor real-time review progress, administrative instructions, and document release dates.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
          Enter Tracking Reference Number
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="e.g. BC-2026-0928-1002"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
            />
          </div>
          <button
            type="button"
            onClick={() => handleSearch()}
            className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-bold text-xs rounded-lg transition shadow flex items-center justify-center gap-1.5"
          >
            <span>Search Application</span>
          </button>
        </div>

        {/* Quick sample chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
          <span>Demo requests:</span>
          {[
            { num: 'BC-2026-0928-1001', label: 'Completed' },
            { num: 'BC-2026-0928-1002', label: 'Ready for Release' },
            { num: 'BC-2026-0928-1003', label: 'Approved' },
            { num: 'BC-2026-0928-1004', label: 'Under Review' },
            { num: 'BC-2026-0928-1006', label: 'For Correction' },
          ].map(item => (
            <button
              key={item.num}
              type="button"
              onClick={() => {
                setSearchQuery(item.num);
                handleSearch(item.num);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-mono transition"
            >
              {item.num} ({item.label})
            </button>
          ))}
        </div>
      </div>

      {/* Not Found State */}
      {notFound && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">Tracking Record Not Found</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            No request matches "{searchQuery}". Please verify that your tracking number is correct 
            or review your recent submissions in the <strong>My Requests</strong> tab.
          </p>
          {onOpenMyRequests && (
            <button
              onClick={onOpenMyRequests}
              className="text-xs font-semibold text-emerald-800 underline mt-2 block mx-auto"
            >
              View My Stored Requests
            </button>
          )}
        </div>
      )}

      {/* Found Request Detail Card */}
      {request && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Card Top Banner */}
          <div className="bg-emerald-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-emerald-300 mb-1">
                <span className="font-mono bg-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-700">
                  {request.tracking_number}
                </span>
                <span>•</span>
                <span>Filed on {new Date(request.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <h2 className="text-xl font-bold font-serif">{request.service_name}</h2>
              <p className="text-xs text-emerald-200 mt-0.5">
                Applicant: {request.applicant_first_name} {request.applicant_middle_name || ''} {request.applicant_last_name} {request.applicant_suffix || ''} ({request.purok_zone})
              </p>
            </div>

            {/* Current Status Pill */}
            <div className="self-start sm:self-center">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  request.status === 'Completed'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : request.status === 'Ready for Release'
                    ? 'bg-teal-100 text-teal-900 border border-teal-300 animate-pulse'
                    : request.status === 'Approved'
                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                    : request.status === 'For Correction'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : request.status === 'Rejected'
                    ? 'bg-red-100 text-red-900 border border-red-300'
                    : 'bg-slate-100 text-slate-800 border border-slate-300'
                }`}
              >
                {request.status}
              </span>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-5">
              Filing Progression
            </h4>

            {request.status === 'Rejected' ? (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-900 text-sm">Application Rejected</h4>
                  <p className="text-xs text-red-700 mt-1">
                    Reason: {request.rejection_reason || 'Incomplete qualifications or invalid documentation provided.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-2 text-center relative">
                {statusSteps.map((step, idx) => {
                  const currentIdx = getStepIndex(request.status);
                  const isPassed = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={step} className="flex flex-col items-center relative">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition shadow-xs ${
                          isCurrent
                            ? 'bg-amber-400 text-emerald-950 ring-4 ring-amber-100'
                            : isPassed
                            ? 'bg-emerald-800 text-amber-300'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        {isPassed && !isCurrent ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span
                        className={`text-[10px] sm:text-xs font-semibold leading-tight ${
                          isCurrent ? 'text-emerald-900 font-bold' : isPassed ? 'text-slate-800' : 'text-slate-400'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Remarks & Instructions */}
          <div className="p-6 space-y-6">
            {/* Status Attention Box */}
            {request.status === 'For Correction' && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h4 className="font-bold text-amber-900 text-sm">Action Needed: Correction Requested</h4>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Barangay Staff Note:</strong> {request.admin_remarks || 'Please bring updated supporting documents to the Barangay Hall.'}
                </p>
              </div>
            )}

            {request.status === 'Ready for Release' && (
              <div className="bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r-xl space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  <h4 className="font-bold text-emerald-900 text-sm">Ready for In-Person Releasing!</h4>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Your document has been printed, verified, and dry-sealed. Please proceed to 
                  <strong> Barangay Camohaguin Releasing Desk Window 1</strong>. Bring this tracking number and a valid government ID.
                </p>
                {request.target_release_date && (
                  <p className="text-xs text-emerald-700 font-medium pt-1">
                    Scheduled Releasing Window: <strong>{request.target_release_date}</strong> (8:00 AM - 5:00 PM)
                  </p>
                )}
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider block text-[11px]">
                  Filing Details
                </span>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Service:</span>
                  <span className="font-semibold text-slate-800">{request.service_name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Stated Purpose:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[200px]">{request.purpose}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Residency Verification:</span>
                  <span className="font-bold">
                    {request.residency_verified ? (
                      <span className="text-emerald-700">Verified Resident Record</span>
                    ) : (
                      <span className="text-slate-500">Unverified / Walk-in</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Applicant Contact:</span>
                  <span className="font-mono text-slate-800">{request.applicant_contact}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider block text-[11px]">
                  Administrative Review
                </span>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Assigned Reviewer:</span>
                  <span className="font-semibold text-slate-800">{request.reviewed_by_name || 'Frontline Desk Staff'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Target Release Date:</span>
                  <span className="font-semibold text-slate-800">{request.target_release_date || 'Standard Turnaround'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Admin Remarks:</span>
                  <span className="font-medium text-slate-700 text-right max-w-[200px]">{request.admin_remarks || 'None'}</span>
                </div>
                {request.actual_released_at && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Actual Date Released:</span>
                    <span className="font-semibold text-emerald-700">
                      {new Date(request.actual_released_at).toLocaleDateString('en-PH')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Print Slip Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Acknowledgment Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
