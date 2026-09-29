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
import { BarangayDatabase } from '../../services/db';
import { BarangayService, Resident } from '../../types/schema';

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
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [birthDate, setBirthDate] = useState('1995-01-01');
  const [gender, setGender] = useState('Female');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [purokZone, setPurokZone] = useState('Purok 1');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [certifyResident, setCertifyResident] = useState(true);
  const [registerError, setRegisterError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginIdentifier.trim()) {
      setLoginError('Please enter your email, mobile number, or Resident ID.');
      return;
    }

    const result = BarangayDatabase.loginCitizen(loginIdentifier, loginPassword);
    if (result.success && result.resident) {
      setLoginSuccessMessage(result.message);
      setTimeout(() => {
        onSuccess(result.resident!);
        onClose();
      }, 500);
    } else {
      setLoginError(result.message);
    }
  };

  // Quick Demo Login Handler
  const handleQuickDemoLogin = (identifier: string) => {
    setLoginError(null);
    const result = BarangayDatabase.loginCitizen(identifier);
    if (result.success && result.resident) {
      setLoginSuccessMessage(`Logging in as ${result.resident.first_name} ${result.resident.last_name}...`);
      setTimeout(() => {
        onSuccess(result.resident!);
        onClose();
      }, 400);
    }
  };

  // Handle Registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setRegisterError('First Name and Last Name are required.');
      return;
    }
    if (!contactNumber.trim()) {
      setRegisterError('Contact mobile number is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setRegisterError('A valid email address is required.');
      return;
    }
    if (!address.trim()) {
      setRegisterError('House/Street address in Barangay Camohaguin is required.');
      return;
    }
    if (!certifyResident) {
      setRegisterError('Please confirm that you reside in Barangay Camohaguin.');
      return;
    }

    const result = BarangayDatabase.registerCitizen({
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      suffix,
      birth_date: birthDate,
      gender,
      contact_number: contactNumber,
      email,
      address,
      purok_zone: purokZone,
    });

    if (result.success && result.resident) {
      setLoginSuccessMessage(result.message);
      setTimeout(() => {
        onSuccess(result.resident);
        onClose();
      }, 600);
    } else {
      setRegisterError(result.message || 'Registration failed.');
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
                    You can enter your registered email, contact number, or ID (e.g. BC-RES-00101).
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password / Account PIN
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

              {/* Fast One-Click Demo Residents */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Quick 1-Click Demo Residents
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('juan.delacruz@gmail.com')}
                    className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/60 transition group"
                  >
                    <div className="font-bold text-slate-800 group-hover:text-emerald-900 flex items-center justify-between">
                      <span>Juan Dela Cruz</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Purok 1</span>
                    </div>
                    <span className="text-[11px] text-slate-500">Verified Citizen • Household Head</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('maria.cruz@gmail.com')}
                    className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/60 transition group"
                  >
                    <div className="font-bold text-slate-800 group-hover:text-emerald-900 flex items-center justify-between">
                      <span>Maria Santos Cruz</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Purok 1</span>
                    </div>
                    <span className="text-[11px] text-slate-500">Verified Citizen • BHW Volunteer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('eduardo.reyes@yahoo.com')}
                    className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/60 transition group sm:col-span-2"
                  >
                    <div className="font-bold text-slate-800 group-hover:text-emerald-900 flex items-center justify-between">
                      <span>Eduardo Alvarez Reyes Jr.</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Purok 2</span>
                    </div>
                    <span className="text-[11px] text-slate-500">Verified Citizen • Senior Member</span>
                  </button>
                </div>
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

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="col-span-2 sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Maria"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Santos"
                      value={middleName}
                      onChange={e => setMiddleName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Suffix
                    </label>
                    <input
                      type="text"
                      placeholder="Jr., III"
                      value={suffix}
                      onChange={e => setSuffix(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cruz"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={e => setBirthDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={e => setGender(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other / Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Mobile Contact Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="0917-123-4567"
                      value={contactNumber}
                      onChange={e => setContactNumber(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="name@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Purok / Zone *
                    </label>
                    <select
                      value={purokZone}
                      onChange={e => setPurokZone(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                    >
                      <option value="Purok 1">Purok 1 (Sentro)</option>
                      <option value="Purok 2">Purok 2 (Kanluran)</option>
                      <option value="Purok 3">Purok 3 (Silangan)</option>
                      <option value="Purok 4">Purok 4 (Ilaya)</option>
                      <option value="Purok 5">Purok 5 (Ibaba)</option>
                      <option value="Purok 6">Purok 6 (Tabing-Dagat)</option>
                      <option value="Purok 7">Purok 7 (Bukid)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      House No. & Street Address *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 142 Rizal Street"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Password / PIN
                  </label>
                  <input
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={certifyResident}
                      onChange={e => setCertifyResident(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 mt-0.5"
                    />
                    <span className="text-[11px] text-slate-600 leading-tight">
                      I declare that I am a bonafide resident of <strong>Barangay Camohaguin, Gumaca, Quezon</strong> and information provided is accurate and authentic.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account & Continue</span>
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
