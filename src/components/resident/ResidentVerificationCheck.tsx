import React, { useState } from 'react';
import { verifyResidencySecurely } from '../../services/residencyVerification';
import { ResidencyVerificationResult } from '../../types/schema';
import { UserCheck, ShieldCheck, CheckCircle2, AlertCircle, HelpCircle, Lock, ArrowRight } from 'lucide-react';

interface ResidentVerificationCheckProps {
  onApplyForService?: () => void;
}

export const ResidentVerificationCheck: React.FC<ResidentVerificationCheckProps> = ({
  onApplyForService,
}) => {
  const [method, setMethod] = useState<'id' | 'details'>('id');
  const [residentId, setResidentId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResidencyVerificationResult | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await verifyResidencySecurely(
        method === 'id'
          ? { resident_id: residentId.trim() }
          : { first_name: firstName.trim(), last_name: lastName.trim(), birth_date: birthDate }
      );
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 text-xs px-2.5 py-0.5 rounded-full font-bold mb-2">
          <Lock className="w-3 h-3 text-emerald-700" />
          <span>Privacy Protected Verification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
          Verify Residency Status
        </h1>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
          Check if you are registered in the official Barangay Camohaguin Resident Registry. 
          Verified status expedites release of clearances and qualifies you for social assistance.
        </p>
      </div>

      {/* Security Privacy Notice */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-600 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Strict Data Protection Guarantee</span>
        </div>
        <p className="leading-relaxed">
          In compliance with the Data Privacy Act of 2012, this tool does not expose the resident database. 
          Queries are verified server-side using exact-match records and return only the verification status.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        {/* Switch tab */}
        <div className="flex rounded-lg bg-slate-100 p-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setMethod('id');
              setResult(null);
            }}
            className={`flex-1 py-2 font-bold rounded-md transition ${
              method === 'id' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-600'
            }`}
          >
            By Resident System ID
          </button>
          <button
            type="button"
            onClick={() => {
              setMethod('details');
              setResult(null);
            }}
            className={`flex-1 py-2 font-bold rounded-md transition ${
              method === 'details' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-600'
            }`}
          >
            By Name & Birth Date
          </button>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          {method === 'id' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Resident System ID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BC-RES-00101"
                value={residentId}
                onChange={e => setResidentId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 uppercase font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Found on your previous Barangay Clearance receipt or Purok Certificate.
                <br />
                Sample verified IDs: <strong className="text-emerald-700 cursor-pointer underline" onClick={() => setResidentId('BC-RES-00101')}>BC-RES-00101</strong>, <strong className="text-emerald-700 cursor-pointer underline" onClick={() => setResidentId('BC-RES-00103')}>BC-RES-00103</strong>, <strong className="text-amber-700 cursor-pointer underline" onClick={() => setResidentId('BC-RES-00107')}>BC-RES-00107 (Unverified)</strong>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juan"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cruz"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Try sample: First Name: <strong>Juan</strong>, Last Name: <strong>Cruz</strong>, Birth Date: <code>1988-05-12</code>
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-amber-300 font-bold text-xs sm:text-sm rounded-lg transition shadow flex items-center justify-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>{loading ? 'Consulting Resident Registry...' : 'Verify Residency Status'}</span>
          </button>
        </form>

        {/* Verification Result Card */}
        {result && (
          <div
            className={`p-5 rounded-xl border space-y-3 ${
              result.is_verified
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                : 'bg-amber-50/90 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-3">
              {result.is_verified ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="text-xs font-extrabold uppercase tracking-wide block">
                  {result.is_verified ? 'Residency Record Verified' : 'Residency Status Notice'}
                </span>
                <p className="text-xs mt-1 leading-relaxed">{result.message}</p>

                {result.is_verified && (
                  <div className="mt-3 pt-3 border-t border-emerald-200/80 flex flex-wrap gap-2 text-xs">
                    <span className="bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded font-mono font-bold">
                      ID: {result.resident_id}
                    </span>
                    <span className="bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded font-semibold">
                      Registered: {result.purok_zone}
                    </span>
                    <span className="bg-emerald-800 text-amber-300 px-2 py-0.5 rounded font-bold">
                      STATUS: ACTIVE VERIFIED
                    </span>
                  </div>
                )}
              </div>
            </div>

            {result.is_verified && onApplyForService && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onApplyForService}
                  className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Proceed to File Service Application</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
