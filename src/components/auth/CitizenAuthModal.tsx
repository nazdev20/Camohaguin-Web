import React, { useState } from 'react';
import {
  X,
  User,
  Lock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  UserPlus,
  LogIn
} from 'lucide-react';
import { BarangayService, Resident } from '../../types/schema';
import { getCurrentUserProfile, login, registerResident } from '../../app/actions/auth';

interface CitizenAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (resident: Resident) => void;
  pendingService?: BarangayService | null;
  initialTab?: 'login' | 'register';
}

export const CitizenAuthModal: React.FC<CitizenAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  pendingService,
  initialTab = 'login',
}) => {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState<string | null>(null);

  // Register form state
  const [residentId, setResidentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerError, setRegisterError] = useState<string | null>(null);

  if (!isOpen) return null;

  const mapDbProfileToSchemaResident = (profile: any): Resident => ({
    resident_id: profile.id || profile.resident_id || `BC-RES-${Date.now()}`,
    household_id: profile.household_id || undefined,
    first_name: profile.first_name || '',
    middle_name: profile.middle_name || undefined,
    last_name: profile.last_name || '',
    suffix: profile.suffix || undefined,
    birth_date: profile.date_of_birth || profile.birth_date || '',
    gender: profile.sex === 'male' ? 'Male' : profile.sex === 'female' ? 'Female' : 'Other',
    civil_status: profile.civil_status || 'Single',
    contact_number: profile.contact_number || undefined,
    email: profile.email_address || profile.email || undefined,
    address: profile.street_address || profile.address || '',
    purok_zone: profile.purok || profile.purok_zone || 'Purok 1',
    is_registered_voter: profile.is_voter ?? false,
    residency_status: (profile.residency_status || 'unverified') as Resident['residency_status'],
    verified_at: profile.verified_at,
    verified_by_user_id: profile.verified_by_user_id,
    remarks: profile.remarks,
    created_at: profile.created_at || new Date().toISOString(),
    updated_at: profile.updated_at || new Date().toISOString(),
  });

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginIdentifier.trim()) {
      setLoginError('Please enter your registered email address.');
      return;
    }

    try {
      const result = await login(loginIdentifier.trim(), loginPassword);
      if (result.success && result.data?.user) {
        const profile = await getCurrentUserProfile();
        const resident = profile.resident ? mapDbProfileToSchemaResident(profile.resident) : null;

        setLoginSuccessMessage(result.message || 'Login successful.');
        setTimeout(() => {
          if (resident) {
            onSuccess(resident);
          }
          onClose();
        }, 500);
      } else {
        setLoginError(result.error || 'Login failed.');
      }
    } catch (error: any) {
      setLoginError(error?.message || 'Login failed.');
    }
  };

  // Handle Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    if (!residentId.trim()) {
      setRegisterError('Resident ID is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setRegisterError('A valid email address is required.');
      return;
    }
    if (!password.trim()) {
      setRegisterError('Password is required.');
      return;
    }

    try {
      const result = await registerResident({
        residentId: residentId.trim(),
        email: email.trim(),
        password: password,
      });

      if (result.success && result.data?.residentId) {
        const profile = await getCurrentUserProfile();
        const resident = profile.resident ? mapDbProfileToSchemaResident(profile.resident) : null;
        setLoginSuccessMessage(result.message || 'Account created successfully.');
        setTimeout(() => {
          if (resident) {
            onSuccess(resident);
          }
          onClose();
        }, 600);
      } else {
        setRegisterError(result.error || 'Registration failed.');
      }
    } catch (error: any) {
      setRegisterError(error?.message || 'Registration failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-700/60 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-emerald-700/80 border-2 border-amber-400 flex items-center justify-center font-bold text-amber-300 font-serif text-lg shadow-inner">
              BC
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-widest text-emerald-300 uppercase block">
                Barangay Camohaguin • Citizen Portal
              </span>
              <h2 className="text-lg font-bold text-white font-serif tracking-tight">
                {pendingService ? 'Sign In to Request Service' : 'Citizen Access & Registration'}
              </h2>
            </div>
          </div>

          {pendingService ? (
            <div className="mt-2 text-xs bg-emerald-950/60 border border-emerald-700/60 rounded-lg p-2.5 flex items-start gap-2 text-emerald-100">
              <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                To request <strong>{pendingService.name}</strong>, please sign in with your resident account or register. Visitors can browse public info, but document issuance requires citizen identity verification.
              </span>
            </div>
          ) : (
            <p className="text-xs text-emerald-200 mt-1">
              Sign in to manage your documents, track requests, and receive official barangay certificates.
            </p>
          )}

          {/* Tab Switcher */}
          <div className="flex bg-emerald-950/80 rounded-xl p-1 mt-4 border border-emerald-700/70">
            <button
              onClick={() => {
                setTab('login');
                setLoginError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                tab === 'login'
                  ? 'bg-amber-400 text-emerald-950 shadow-sm'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In (Pumasok)</span>
            </button>
            <button
              onClick={() => {
                setTab('register');
                setRegisterError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                tab === 'register'
                  ? 'bg-amber-400 text-emerald-950 shadow-sm'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account (Magrehistro)</span>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[72vh] overflow-y-auto">
          {loginSuccessMessage && (
            <div className="mb-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl p-3 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{loginSuccessMessage}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {tab === 'login' && (
            <div className="space-y-5">
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email, Mobile Number, or Resident ID
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. juan.delacruz@gmail.com or 0917-123-4567"
                      value={loginIdentifier}
                      onChange={e => setLoginIdentifier(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Use the email address you registered with your barangay account.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Default demo pin is any password or leave blank for registered residents.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In & Continue</span>
                </button>
              </form>

              <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-bold uppercase tracking-wider text-slate-600">Real Account Access</span>
                </div>
                Use your registered barangay email account and password. This authentication is validated against the live database session.
              </div>
            </div>
          )}

          {/* TAB 2: REGISTER */}
          {tab === 'register' && (
            <div className="space-y-4">
              {registerError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{registerError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Resident ID *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter resident ID from the barangay registry"
                    value={residentId}
                    onChange={e => setResidentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none uppercase"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    The system will verify that this ID exists in the resident table and matches the email below.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    placeholder="Create password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Resident Account</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-3 px-6 text-center text-[11px] text-slate-500">
          Barangay Camohaguin Public e-Services • Republic Act No. 10173 (Data Privacy Act)
        </div>
      </div>
    </div>
  );
};
