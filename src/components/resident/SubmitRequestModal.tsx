import React, { useState } from 'react';
import { BarangayService, Resident, ServiceRequest } from '../../types/schema';
import { BarangayDatabase } from '../../services/db';
import { verifyResidencySecurely } from '../../services/residencyVerification';
import {
  X,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  Copy,
  Check,
  Building,
  UploadCloud,
  ShieldCheck
} from 'lucide-react';

interface SubmitRequestModalProps {
  service: BarangayService | null;
  onClose: () => void;
  onSuccess: (newRequest: ServiceRequest) => void;
  currentCitizen?: Resident | null;
}

export const SubmitRequestModal: React.FC<SubmitRequestModalProps> = ({
  service,
  onClose,
  onSuccess,
  currentCitizen,
}) => {
  if (!service) return null;

  const activeCitizen = currentCitizen || BarangayDatabase.getCurrentCitizen();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(activeCitizen ? 2 : 1);

  // Verification step fields
  const [verificationMode, setVerificationMode] = useState<'id' | 'name'>('id');
  const [residentIdInput, setResidentIdInput] = useState(activeCitizen?.resident_id || '');
  const [vFirstName, setVFirstName] = useState(activeCitizen?.first_name || '');
  const [vLastName, setVLastName] = useState(activeCitizen?.last_name || '');
  const [vBirthDate, setVBirthDate] = useState(activeCitizen?.birth_date || '');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    tested: boolean;
    is_verified: boolean;
    resident_id?: string;
    purok_zone?: string;
    message: string;
  }>({
    tested: !!activeCitizen,
    is_verified: activeCitizen?.residency_status === 'verified',
    resident_id: activeCitizen?.resident_id,
    purok_zone: activeCitizen?.purok_zone,
    message: activeCitizen ? `Logged in as verified resident (${activeCitizen.purok_zone}).` : '',
  });

  // Applicant form fields
  const [firstName, setFirstName] = useState(activeCitizen?.first_name || '');
  const [middleName, setMiddleName] = useState(activeCitizen?.middle_name || '');
  const [lastName, setLastName] = useState(activeCitizen?.last_name || '');
  const [suffix, setSuffix] = useState(activeCitizen?.suffix || '');
  const [contactNumber, setContactNumber] = useState(activeCitizen?.contact_number || '');
  const [email, setEmail] = useState(activeCitizen?.email || '');
  const [purokZone, setPurokZone] = useState(activeCitizen?.purok_zone || 'Purok 1');
  const [address, setAddress] = useState(activeCitizen?.address || '');
  const [purpose, setPurpose] = useState('');
  const [residentId, setResidentId] = useState<string | undefined>(activeCitizen?.resident_id);
  const [residencyVerified, setResidencyVerified] = useState(activeCitizen?.residency_status === 'verified');

  // Requirements checklist confirmation
  const [requirementsConfirmed, setRequirementsConfirmed] = useState<Record<string, boolean>>({});
  const [simulatedFiles, setSimulatedFiles] = useState<Record<string, string>>({});

  // Created request state for Step 4
  const [createdRequest, setCreatedRequest] = useState<ServiceRequest | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Handle Verify Residency
  const handleCheckResidency = async () => {
    setVerifying(true);
    try {
      const result = await verifyResidencySecurely(
        verificationMode === 'id'
          ? { resident_id: residentIdInput }
          : { first_name: vFirstName, last_name: vLastName, birth_date: vBirthDate }
      );

      setVerificationResult({
        tested: true,
        is_verified: result.is_verified,
        resident_id: result.resident_id,
        purok_zone: result.purok_zone,
        message: result.message,
      });

      if (result.is_verified) {
        setResidencyVerified(true);
        if (result.resident_id) setResidentId(result.resident_id);
        if (result.purok_zone) setPurokZone(result.purok_zone);
        if (verificationMode === 'name') {
          setFirstName(vFirstName);
          setLastName(vLastName);
        }
      } else {
        setResidencyVerified(false);
      }
    } finally {
      setVerifying(false);
    }
  };

  // Skip or continue to Step 2
  const handleProceedToDetails = () => {
    // If not verified, but resident clicked Proceed
    if (verificationResult.is_verified) {
      // Auto populate name if verified from db
      if (verificationResult.resident_id) {
        const reg = BarangayDatabase.getResidentById(verificationResult.resident_id);
        if (reg) {
          setFirstName(reg.first_name);
          setMiddleName(reg.middle_name || '');
          setLastName(reg.last_name);
          setSuffix(reg.suffix || '');
          if (reg.contact_number) setContactNumber(reg.contact_number);
          if (reg.email) setEmail(reg.email);
          setAddress(reg.address);
          setPurokZone(reg.purok_zone);
        }
      }
    }
    setStep(2);
  };

  // Submit final request
  const handleSubmitFinal = (e: React.FormEvent) => {
    e.preventDefault();

    const newReq = BarangayDatabase.createRequest({
      service_id: service.id,
      service_name: service.name,
      resident_id: residencyVerified ? residentId : undefined,
      applicant_first_name: firstName.trim(),
      applicant_middle_name: middleName.trim() || undefined,
      applicant_last_name: lastName.trim(),
      applicant_suffix: suffix.trim() || undefined,
      applicant_contact: contactNumber.trim(),
      applicant_email: email.trim() || undefined,
      purok_zone: purokZone,
      address: address.trim(),
      purpose: purpose.trim(),
      residency_verified: residencyVerified,
      status: 'Submitted',
      admin_remarks: 'Application submitted via Online Resident Portal.',
      target_release_date: new Date(Date.now() + service.processing_days * 86400000).toISOString().split('T')[0],
      documents: Object.keys(simulatedFiles).map((reqId, idx) => ({
        id: `doc-${Date.now()}-${idx}`,
        request_tracking_number: '',
        requirement_id: reqId,
        document_name: simulatedFiles[reqId],
        file_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60',
        uploaded_at: new Date().toISOString(),
        is_verified: false,
      })),
    });

    // Save tracking number to local browser cache for "My Requests"
    try {
      const myReqs = JSON.parse(localStorage.getItem('bc_my_requests') || '[]');
      if (!myReqs.includes(newReq.tracking_number)) {
        myReqs.unshift(newReq.tracking_number);
        localStorage.setItem('bc_my_requests', JSON.stringify(myReqs));
      }
    } catch (e) {
      console.warn('Could not save to my_requests cache', e);
    }

    setCreatedRequest(newReq);
    setStep(4);
    onSuccess(newReq);
  };

  const handleCopyTracking = () => {
    if (createdRequest?.tracking_number) {
      navigator.clipboard.writeText(createdRequest.tracking_number);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 relative">
          {step !== 4 && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-emerald-300 hover:text-white p-1 rounded-full hover:bg-emerald-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold bg-emerald-800 text-amber-300 px-2 py-0.5 rounded border border-emerald-700">
              {service.code}
            </span>
            <span className="text-xs text-emerald-200">Online Filing Form</span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold font-serif leading-tight">
            Apply: {service.name}
          </h2>

          {/* Stepper indicators */}
          {step !== 4 && (
            <div className="flex items-center gap-2 mt-4 text-xs font-semibold">
              <span className={`px-2 py-0.5 rounded ${step === 1 ? 'bg-amber-400 text-emerald-950 font-bold' : 'text-emerald-300'}`}>
                1. Residency Check
              </span>
              <span className="text-emerald-500">→</span>
              <span className={`px-2 py-0.5 rounded ${step === 2 ? 'bg-amber-400 text-emerald-950 font-bold' : 'text-emerald-300'}`}>
                2. Applicant Info
              </span>
              <span className="text-emerald-500">→</span>
              <span className={`px-2 py-0.5 rounded ${step === 3 ? 'bg-amber-400 text-emerald-950 font-bold' : 'text-emerald-300'}`}>
                3. Purpose & Docs
              </span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: RESIDENCY VERIFICATION */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-900 block mb-1">Residency Registry Matching</span>
                {service.requires_residency_verification ? (
                  <span>
                    This service requires residency verification in Barangay Camohaguin. 
                    Please enter your <strong>Resident ID</strong> or <strong>Full Name and Birthdate</strong> to match your official resident record.
                  </span>
                ) : (
                  <span>
                    Residency verification is optional for this service. You can match your resident record to auto-fill your details, or proceed as a non-resident applicant.
                  </span>
                )}
              </div>

              {/* Toggle ID vs Name */}
              <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setVerificationMode('id')}
                  className={`flex-1 py-1.5 font-semibold rounded-md transition ${
                    verificationMode === 'id' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Verify by Resident ID
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationMode('name')}
                  className={`flex-1 py-1.5 font-semibold rounded-md transition ${
                    verificationMode === 'name' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Verify by Name & DOB
                </button>
              </div>

              {verificationMode === 'id' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Resident System ID (e.g. BC-RES-00101)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="BC-RES-00101"
                      value={residentIdInput}
                      onChange={e => setResidentIdInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 uppercase font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleCheckResidency}
                      disabled={verifying || !residentIdInput.trim()}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-amber-300 font-bold text-xs rounded-lg transition"
                    >
                      {verifying ? 'Checking...' : 'Check Registry'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Try sample resident IDs: <code className="text-emerald-700 font-semibold cursor-pointer underline" onClick={() => setResidentIdInput('BC-RES-00101')}>BC-RES-00101</code>, <code className="text-emerald-700 font-semibold cursor-pointer underline" onClick={() => setResidentIdInput('BC-RES-00104')}>BC-RES-00104</code>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">First Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Juan"
                        value={vFirstName}
                        onChange={e => setVFirstName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Cruz"
                        value={vLastName}
                        onChange={e => setVLastName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={vBirthDate}
                      onChange={e => setVBirthDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckResidency}
                    disabled={verifying || !vFirstName || !vLastName || !vBirthDate}
                    className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-amber-300 font-bold text-xs rounded-lg transition"
                  >
                    {verifying ? 'Checking...' : 'Check Registry'}
                  </button>
                  <p className="text-[11px] text-slate-400">
                    Sample: <strong>Juan Cruz</strong>, DOB: <code>1988-05-12</code>
                  </p>
                </div>
              )}

              {/* Result Notice */}
              {verificationResult.tested && (
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                    verificationResult.is_verified
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}
                >
                  {verificationResult.is_verified ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block">
                      {verificationResult.is_verified ? 'Verified Resident Matched' : 'Residency Status Notice'}
                    </span>
                    <p className="mt-0.5 leading-relaxed">{verificationResult.message}</p>
                    {verificationResult.is_verified && (
                      <span className="inline-block mt-1 font-mono text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                        Internal ID: {verificationResult.resident_id} ({verificationResult.purok_zone})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: APPLICANT DETAILS */}
          {step === 2 && (
            <div className="space-y-4">
              {residencyVerified ? (
                <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Verified Resident Record: <strong>{residentId}</strong>
                  </span>
                  <span className="bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded text-[10px] font-bold">
                    VERIFIED
                  </span>
                </div>
              ) : (
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-600">
                  <span>Filing as <strong>Unverified / Walk-in Applicant</strong>. Supporting physical IDs will be checked upon claiming.</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={middleName}
                    onChange={e => setMiddleName(e.target.value)}
                    placeholder="Middle name"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Suffix</label>
                  <input
                    type="text"
                    value={suffix}
                    onChange={e => setSuffix(e.target.value)}
                    placeholder="Jr., III"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Mobile *</label>
                  <input
                    type="text"
                    required
                    value={contactNumber}
                    onChange={e => setContactNumber(e.target.value)}
                    placeholder="0917-000-0000"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Purok / Zone *</label>
                  <select
                    value={purokZone}
                    onChange={e => setPurokZone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="Purok 1">Purok 1</option>
                    <option value="Purok 2">Purok 2</option>
                    <option value="Purok 3">Purok 3</option>
                    <option value="Purok 4">Purok 4</option>
                    <option value="Purok 5">Purok 5</option>
                    <option value="Purok 6">Purok 6</option>
                    <option value="Purok 7">Purok 7</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">House No. & Street *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="e.g. 124 Rizal St."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PURPOSE & ATTACHMENTS */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Specific Purpose of Request *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify clearly (e.g. Local employment at municipal hall, bank loan application, scholarship verification, travel visa requirement)..."
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Requirement Checklist */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wide">
                  Requirements & Supporting Documents
                </h4>
                {service.requirements && service.requirements.length > 0 ? (
                  <div className="space-y-2">
                    {service.requirements.map(req => {
                      const isAttached = !!simulatedFiles[req.id];
                      return (
                        <div
                          key={req.id}
                          className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-900 block">{req.requirement_name}</span>
                            <span className="text-[11px] text-slate-500">{req.description}</span>
                            {isAttached && (
                              <div className="mt-1 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Attached: {simulatedFiles[req.id]}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                const dummyName = `${req.requirement_name.replace(/\s+/g, '_')}_upload.pdf`;
                                setSimulatedFiles(prev => ({ ...prev, [req.id]: dummyName }));
                              }}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded border transition flex items-center gap-1 ${
                                isAttached
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>{isAttached ? 'Re-upload' : 'Attach File'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No special document uploads mandatory. Please present valid ID upon pickup.
                  </p>
                )}
              </div>

              {/* Summary recap */}
              <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Applicant:</span>
                  <span className="font-bold text-slate-800">{firstName} {lastName} {suffix}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Processing:</span>
                  <span className="font-semibold text-slate-800">
                    {(service.processing_days ?? 1) === 1 ? '1 Working Day' : `${service.processing_days ?? 1} Working Days`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Applicable Barangay Fee:</span>
                  <span className="font-bold text-slate-900">
                    {(service.fee_amount ?? 0) === 0 ? 'FREE' : `₱${Number(service.fee_amount ?? 0).toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS SLIP */}
          {step === 4 && createdRequest && (
            <div className="space-y-5 text-center py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-700" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Request Successfully Submitted!
                </span>
                <h3 className="text-xl font-bold font-serif text-slate-900 mt-1">
                  Official Tracking Reference
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Your application has been received and queued for review by the Barangay Secretary.
                </p>
              </div>

              {/* Tracking Box */}
              <div className="bg-slate-50 border-2 border-dashed border-emerald-500/80 p-4 rounded-xl max-w-sm mx-auto text-center space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block">
                  TRACKING NUMBER
                </span>
                <div className="font-mono text-lg sm:text-xl font-extrabold text-emerald-900 tracking-wider">
                  {createdRequest.tracking_number}
                </div>
                <button
                  type="button"
                  onClick={handleCopyTracking}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-800 hover:text-emerald-950 font-semibold bg-emerald-100/70 px-3 py-1 rounded-md transition"
                >
                  {copiedTracking ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTracking ? 'Copied to Clipboard!' : 'Copy Tracking Number'}</span>
                </button>
              </div>

              {/* Pickup info */}
              <div className="text-left bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 space-y-1">
                <span className="font-bold block">Next Steps & Releasing:</span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  1. Track your application status using the "Track Request" tab anytime.
                  <br />
                  2. Target document release date: <strong>{createdRequest.target_release_date || 'Within 24 Hours'}</strong>.
                  <br />
                  3. Please proceed to the Barangay Hall Releasing Counter with your valid ID once status displays <strong>"Ready for Release"</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToDetails}
                className="px-5 py-2 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition shadow flex items-center gap-1.5"
              >
                <span>Continue to Applicant Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={!firstName.trim() || !lastName.trim() || !contactNumber.trim() || !address.trim()}
                onClick={() => setStep(3)}
                className="px-5 py-2 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition shadow flex items-center gap-1.5"
              >
                <span>Continue to Requirements</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={!purpose.trim()}
                onClick={handleSubmitFinal}
                className="px-6 py-2 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition shadow flex items-center gap-1.5"
              >
                <span>Submit Service Request</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 4 && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
