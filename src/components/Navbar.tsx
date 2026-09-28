import React from 'react';
import {
  ShieldCheck,
  FileText,
  Search,
  Clock,
  Megaphone,
  PhoneCall,
  UserCheck,
  Users,
  Calendar,
  AlertTriangle,
  FolderOpen,
  Briefcase,
  Sliders,
  History,
  Menu,
  X,
  Building2,
  ChevronDown
} from 'lucide-react';
import { AdminUser } from '../types/schema';

interface NavbarProps {
  portal: 'resident' | 'admin';
  setPortal: (p: 'resident' | 'admin') => void;
  activeResidentTab: string;
  setActiveResidentTab: (tab: string) => void;
  activeAdminTab: string;
  setActiveAdminTab: (tab: string) => void;
  activeAdmin: AdminUser;
  onSwitchAdmin: (admin: AdminUser) => void;
  adminsList: AdminUser[];
  pendingRequestsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  portal,
  setPortal,
  activeResidentTab,
  setActiveResidentTab,
  activeAdminTab,
  setActiveAdminTab,
  activeAdmin,
  onSwitchAdmin,
  adminsList,
  pendingRequestsCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = React.useState(false);

  const residentNavItems = [
    { id: 'home', label: 'Home', icon: Building2 },
    { id: 'services', label: 'Services Directory', icon: FileText },
    { id: 'track', label: 'Track Request', icon: Search },
    { id: 'my-requests', label: 'My Requests', icon: Clock },
    { id: 'verify-residency', label: 'Verify Residency', icon: UserCheck },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'info', label: 'Barangay Info', icon: ShieldCheck },
    { id: 'emergency', label: 'Emergency Hotline', icon: PhoneCall },
  ];

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Sliders },
    { 
      id: 'requests', 
      label: 'Service Requests', 
      icon: FileText,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined
    },
    { id: 'residents', label: 'Resident Registry', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'complaints', label: 'Lupon / Blotter', icon: AlertTriangle },
    { id: 'services-mgmt', label: 'Manage Services', icon: Briefcase },
    { id: 'announcements-mgmt', label: 'Announcements', icon: Megaphone },
    { id: 'documents-projects', label: 'Public Docs & Projects', icon: FolderOpen },
    { id: 'audit-logs', label: 'Audit Trail', icon: History },
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
            {portal === 'admin' ? (
              <div className="relative">
                <button
                  onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                  className="flex items-center gap-1.5 bg-emerald-900/80 hover:bg-emerald-800 text-amber-300 px-2.5 py-0.5 rounded border border-emerald-700 font-medium text-xs transition"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Acting as: <strong>{activeAdmin.full_name}</strong> ({activeAdmin.role})</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {adminDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-72 bg-white text-slate-800 rounded-lg shadow-xl border border-slate-200 py-1.5 z-50">
                    <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Switch Barangay Staff
                    </div>
                    {adminsList.map(adm => (
                      <button
                        key={adm.id}
                        onClick={() => {
                          onSwitchAdmin(adm);
                          setAdminDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex flex-col transition hover:bg-emerald-50 ${
                          activeAdmin.id === adm.id ? 'bg-emerald-50/80 font-bold text-emerald-900 border-l-4 border-emerald-600' : 'text-slate-700'
                        }`}
                      >
                        <span className="font-semibold">{adm.full_name}</span>
                        <span className="text-[11px] text-slate-500">{adm.role} • {adm.department}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-emerald-300 text-xs hidden md:inline">
                Barangay Hall Office Hours: Mon - Fri, 8:00 AM - 5:00 PM
              </span>
            )}

            {/* Portal Switcher Button */}
            <div className="flex items-center rounded-lg bg-emerald-900/90 p-0.5 border border-emerald-700">
              <button
                onClick={() => setPortal('resident')}
                className={`px-3 py-0.5 rounded text-xs font-semibold transition ${
                  portal === 'resident'
                    ? 'bg-amber-400 text-emerald-950 shadow-sm'
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                Resident Portal
              </button>
              <button
                onClick={() => setPortal('admin')}
                className={`px-3 py-0.5 rounded text-xs font-semibold transition flex items-center gap-1 ${
                  portal === 'admin'
                    ? 'bg-amber-400 text-emerald-950 shadow-sm'
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                Admin Portal
                {pendingRequestsCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1 rounded-full font-bold">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Barangay Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-emerald-700/80 border-2 border-amber-400/90 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0">
              <span className="text-amber-300 font-serif font-black text-xl tracking-tighter">BC</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white leading-tight font-serif">
                  BARANGAY CAMOHAGUIN
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  portal === 'resident' ? 'bg-emerald-800 text-amber-300 border border-emerald-700' : 'bg-amber-500 text-emerald-950'
                }`}>
                  {portal === 'resident' ? 'Citizen Portal' : 'Staff Admin'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-300 hidden sm:block">
                Modern Digital Services & Public Assistance • Gumaca, Quezon
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-1">
            {portal === 'resident' ? (
              residentNavItems.map(item => {
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
              })
            ) : (
              adminNavItems.map(item => {
                const Icon = item.icon;
                const isActive = activeAdminTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveAdminTab(item.id)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                      isActive
                        ? 'bg-emerald-800 text-amber-300 shadow-sm border border-emerald-700'
                        : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="bg-amber-400 text-emerald-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-0.5">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-emerald-200 hover:text-white hover:bg-emerald-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-emerald-950 border-t border-emerald-800 px-4 pt-3 pb-5 space-y-1">
          <div className="pb-2 mb-2 border-b border-emerald-800/70">
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              Select Mode:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setPortal('resident');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 text-xs font-semibold rounded text-center ${
                  portal === 'resident' ? 'bg-amber-400 text-emerald-950' : 'bg-emerald-900 text-emerald-200'
                }`}
              >
                Resident Portal
              </button>
              <button
                onClick={() => {
                  setPortal('admin');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 text-xs font-semibold rounded text-center ${
                  portal === 'admin' ? 'bg-amber-400 text-emerald-950' : 'bg-emerald-900 text-emerald-200'
                }`}
              >
                Admin Staff Portal
              </button>
            </div>
          </div>

          <div className="space-y-1">
            {portal === 'resident'
              ? residentNavItems.map(item => {
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
                })
              : adminNavItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeAdminTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveAdminTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center justify-between ${
                        isActive
                          ? 'bg-emerald-800 text-amber-300 font-bold'
                          : 'text-emerald-100 hover:bg-emerald-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className="bg-amber-400 text-emerald-950 text-xs font-bold px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
          </div>
        </div>
      )}
    </header>
  );
};
