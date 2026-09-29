import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Search,
  Clock,
  Megaphone,
  PhoneCall,
  Menu,
  X,
  Building2,
  LogIn,
  LogOut,
  User,
  ChevronDown,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { Resident } from '../types/schema';

interface NavbarProps {
  activeResidentTab: string;
  setActiveResidentTab: (tab: string) => void;
  currentCitizen: Resident | null;
  onOpenAuthModal: (tab?: 'login' | 'register') => void;
  onLogoutCitizen: () => void;
  isInternalAdminMode?: boolean;
  onExitInternalAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeResidentTab,
  setActiveResidentTab,
  currentCitizen,
  onOpenAuthModal,
  onLogoutCitizen,
  isInternalAdminMode = false,
  onExitInternalAdmin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Building2 },
    { id: 'services', label: 'Services Directory', icon: FileText },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'track', label: 'Track Request', icon: Search },
    { id: 'my-requests', label: 'My Requests', icon: Clock },
    { id: 'info', label: 'Barangay Info', icon: ShieldCheck },
    { id: 'emergency', label: 'Emergency Hotline', icon: PhoneCall },
  ];

  return (
    <header className="sticky top-0 z-50 bg-emerald-900 text-white shadow-lg border-b border-emerald-800">
      {/* Top Banner with Official Republic Header */}
      <div className="bg-emerald-950 text-emerald-100 text-xs py-1.5 px-4 border-b border-emerald-800/60">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-semibold tracking-wide uppercase">Republic of the Philippines</span>
            <span className="text-emerald-400 hidden sm:inline">•</span>
            <span className="hidden sm:inline text-emerald-200">Municipality of Gumaca, Province of Quezon</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-emerald-300 text-xs hidden md:inline">
              Barangay Hall Hours: Mon - Fri, 8:00 AM - 5:00 PM • Tanod Desk: 24/7
            </span>

            {isInternalAdminMode && onExitInternalAdmin && (
              <button
                onClick={onExitInternalAdmin}
                className="bg-amber-400 hover:bg-amber-300 text-emerald-950 text-[11px] font-bold px-2 py-0.5 rounded transition"
              >
                Exit Internal Staff View
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Barangay Title */}
          <div
            onClick={() => setActiveResidentTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-full bg-emerald-700/80 border-2 border-amber-400/90 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0 group-hover:scale-105 transition">
              <span className="text-amber-300 font-serif font-black text-xl tracking-tighter">BC</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white leading-tight font-serif">
                  BARANGAY CAMOHAGUIN
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-800 text-amber-300 border border-emerald-700">
                  Citizen Portal
                </span>
              </div>
              <p className="text-[11px] text-emerald-300 hidden sm:block">
                Official Digital Citizen Portal • Gumaca, Quezon
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeResidentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveResidentTab(item.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                    isActive
                      ? 'bg-emerald-800 text-amber-300 shadow-sm border border-emerald-700'
                      : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Citizen Authentication / Profile Button */}
          <div className="hidden lg:flex items-center gap-2">
            {!currentCitizen ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuthModal('login')}
                  className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In (Pumasok)</span>
                </button>
                <button
                  onClick={() => onOpenAuthModal('register')}
                  className="bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-semibold px-3 py-1.5 rounded-lg text-xs transition border border-emerald-700"
                >
                  Register
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 bg-emerald-800/90 hover:bg-emerald-700/80 text-white px-3 py-1.5 rounded-lg border border-emerald-700 text-xs font-semibold transition"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center text-amber-300 font-bold border border-amber-400/80 text-[11px]">
                    {currentCitizen.first_name[0]}
                  </div>
                  <div className="text-left">
                    <span className="block leading-tight font-bold text-amber-300">
                      {currentCitizen.first_name} {currentCitizen.last_name}
                    </span>
                    <span className="text-[10px] text-emerald-300 block">
                      {currentCitizen.purok_zone} • Verified
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-300" />
                </button>

                {/* Profile Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-64 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="font-bold text-xs text-slate-900">
                        {currentCitizen.first_name} {currentCitizen.middle_name ? `${currentCitizen.middle_name} ` : ''}{currentCitizen.last_name} {currentCitizen.suffix || ''}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        ID: {currentCitizen.resident_id}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified Resident of Camohaguin</span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setActiveResidentTab('my-requests');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2 transition"
                      >
                        <Clock className="w-4 h-4 text-emerald-700" />
                        <span>My Requests & Clearances</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveResidentTab('services');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2 transition"
                      >
                        <FileText className="w-4 h-4 text-emerald-700" />
                        <span>Request a New Service</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          onLogoutCitizen();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition font-semibold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out (Mag-logout)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            {!currentCitizen ? (
              <button
                onClick={() => onOpenAuthModal('login')}
                className="bg-amber-400 text-emerald-950 font-bold px-2.5 py-1 rounded text-xs"
              >
                Log In
              </button>
            ) : (
              <button
                onClick={() => setActiveResidentTab('my-requests')}
                className="bg-emerald-800 text-amber-300 font-bold px-2.5 py-1 rounded text-xs border border-emerald-700"
              >
                {currentCitizen.first_name}
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-emerald-200 hover:text-white hover:bg-emerald-800 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-emerald-950 border-t border-emerald-800 px-4 pt-3 pb-5 space-y-2">
          {/* Mobile User Profile Status */}
          {currentCitizen ? (
            <div className="bg-emerald-900/90 rounded-xl p-3 border border-emerald-700/80 mb-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-300 block uppercase font-bold">Logged In Resident</span>
                  <span className="font-bold text-amber-300 text-sm">
                    {currentCitizen.first_name} {currentCitizen.last_name}
                  </span>
                  <span className="text-xs text-emerald-200 block">
                    {currentCitizen.purok_zone} • ID: {currentCitizen.resident_id}
                  </span>
                </div>
                <button
                  onClick={() => {
                    onLogoutCitizen();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-red-300 hover:text-red-200 bg-red-950/60 px-2.5 py-1 rounded border border-red-800"
                >
                  Log Out
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-900/60 rounded-xl p-3 border border-emerald-800 flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold text-white block">Citizen Account</span>
                <span className="text-[11px] text-emerald-300">Required to apply for clearances & services</span>
              </div>
              <button
                onClick={() => {
                  onOpenAuthModal('login');
                  setMobileMenuOpen(false);
                }}
                className="bg-amber-400 text-emerald-950 font-bold px-3 py-1 rounded text-xs"
              >
                Log In / Register
              </button>
            </div>
          )}

          <div className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeResidentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveResidentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2.5 ${
                    isActive
                      ? 'bg-emerald-800 text-amber-300 font-bold'
                      : 'text-emerald-100 hover:bg-emerald-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
