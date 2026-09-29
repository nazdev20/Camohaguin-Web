import React from 'react';
import { BarangayService } from '../../types/schema';
import { X, Clock, FileText, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface ServiceDetailModalProps {
  service: BarangayService | null;
  onClose: () => void;
  onApply: (service: BarangayService) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  onApply,
}) => {
  if (!service) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-300 hover:text-white p-1 rounded-full hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs font-bold bg-emerald-800 text-amber-300 px-2 py-0.5 rounded border border-emerald-700">
              {service.code}
            </span>
            <span className="text-xs text-emerald-200">{service.category}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-serif leading-tight">
            {service.name}
          </h2>
          <p className="text-xs text-emerald-100/90 mt-2 leading-relaxed">
            {service.description}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Key Facts Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Document Fee</span>
              <span className="text-sm font-extrabold text-slate-900">
                {(service.fee_amount ?? 0) === 0 ? 'FREE' : `₱${Number(service.fee_amount ?? 0).toFixed(2)}`}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Turnaround Time</span>
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                {(service.processing_days ?? 1) === 1 ? '1 Working Day' : `${service.processing_days ?? 1} Working Days`}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Residency Policy</span>
              <span className="text-xs font-semibold text-slate-800">
                {service.requires_residency_verification ? 'Verified Residents' : 'All Applicants'}
              </span>
            </div>
          </div>

          {/* Requirements Checklist */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>Document Requirements</span>
            </h4>

            {service.requirements && service.requirements.length > 0 ? (
              <div className="space-y-2.5">
                {service.requirements.map(req => (
                  <div
                    key={req.id}
                    className="p-3 rounded-lg border border-slate-200 bg-white flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">{req.requirement_name}</span>
                        {req.is_mandatory ? (
                          <span className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.2 rounded font-bold">
                            Required
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                            Optional
                          </span>
                        )}
                      </div>
                      {req.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {req.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Standard valid government identification card required upon release.
              </p>
            )}
          </div>

          {/* Releasing Guidelines */}
          <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-xl space-y-1">
            <h5 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Releasing Notice</span>
            </h5>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              When claiming your document, please bring your printed or digital Tracking Reference Number, 
              original supporting IDs, and exact cash fee (if applicable) at the Barangay Camohaguin Releasing Desk.
            </p>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onApply(service);
            }}
            className="px-5 py-2 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition shadow flex items-center gap-1.5"
          >
            <span>Start Online Application</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
