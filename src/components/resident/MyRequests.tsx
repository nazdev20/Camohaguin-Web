import React, { useState, useEffect } from 'react';
import { BarangayDatabase } from '../../services/db';
import { ServiceRequest } from '../../types/schema';
import { Clock, ArrowRight, FileText, CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react';

interface MyRequestsProps {
  onSelectTrack: (trackingNumber: string) => void;
  onApplyNew: () => void;
}

export const MyRequests: React.FC<MyRequestsProps> = ({
  onSelectTrack,
  onApplyNew,
}) => {
  const [cachedTrackingNumbers, setCachedTrackingNumbers] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('bc_my_requests') || '[]');
      if (Array.isArray(stored) && stored.length > 0) {
        setCachedTrackingNumbers(stored);
      } else {
        // Default with 2 demo requests so the user sees immediate history
        const demoDefaults = ['BC-2026-0928-1002', 'BC-2026-0928-1003'];
        setCachedTrackingNumbers(demoDefaults);
        localStorage.setItem('bc_my_requests', JSON.stringify(demoDefaults));
      }
    } catch (e) {
      console.warn('Storage read error', e);
    }
  }, []);

  const allRequests = BarangayDatabase.getRequests();
  const myRequestsList: ServiceRequest[] = cachedTrackingNumbers
    .map(t => allRequests.find(r => r.tracking_number.toUpperCase() === t.toUpperCase()))
    .filter((r): r is ServiceRequest => r !== undefined);

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualInput.trim().toUpperCase();
    if (!clean) return;

    if (!cachedTrackingNumbers.includes(clean)) {
      const updated = [clean, ...cachedTrackingNumbers];
      setCachedTrackingNumbers(updated);
      localStorage.setItem('bc_my_requests', JSON.stringify(updated));
    }
    setManualInput('');
  };

  const handleRemove = (trackingNumber: string) => {
    const updated = cachedTrackingNumbers.filter(t => t !== trackingNumber);
    setCachedTrackingNumbers(updated);
    localStorage.setItem('bc_my_requests', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
            My Service Filings
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Quickly monitor applications submitted from this device.
          </p>
        </div>
        <button
          onClick={onApplyNew}
          className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold px-4 py-2 rounded-lg text-xs transition shadow flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Application</span>
        </button>
      </div>

      {/* Manual Add Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <span className="text-xs text-slate-600 font-medium">
          Have an existing tracking number from another device?
        </span>
        <form onSubmit={handleAddManual} className="flex gap-2">
          <input
            type="text"
            placeholder="BC-2026-..."
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            Add to List
          </button>
        </form>
      </div>

      {/* Requests List */}
      {myRequestsList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <Clock className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">No Active Filings on this Device</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't submitted any service requests yet, or your browsing session was cleared.
          </p>
          <button
            onClick={onApplyNew}
            className="px-4 py-2 bg-emerald-800 text-amber-300 rounded-lg text-xs font-bold hover:bg-emerald-900 transition mt-2 inline-block"
          >
            Browse Services & Apply
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {myRequestsList.map(req => (
            <div
              key={req.tracking_number}
              className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-emerald-500 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded border border-emerald-200">
                    {req.tracking_number}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
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
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm">{req.service_name}</h3>
                <p className="text-xs text-slate-500">
                  Applicant: <strong>{req.applicant_first_name} {req.applicant_last_name}</strong> • Filed: {new Date(req.created_at).toLocaleDateString('en-PH')}
                </p>
                {req.admin_remarks && (
                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 mt-1">
                    Staff Note: {req.admin_remarks}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => onSelectTrack(req.tracking_number)}
                  className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-amber-300 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                >
                  <span>Track Full Progress</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(req.tracking_number)}
                  title="Remove from my quick list"
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
