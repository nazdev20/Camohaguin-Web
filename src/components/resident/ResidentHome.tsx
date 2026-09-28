import React from 'react';
import {
  FileText,
  Search,
  UserCheck,
  PhoneCall,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Megaphone,
  AlertCircle,
  Building,
  Sparkles
} from 'lucide-react';
import { Announcement, BarangayService } from '../../types/schema';

interface ResidentHomeProps {
  onNavigate: (tab: string) => void;
  onSelectService: (service: BarangayService) => void;
  services: BarangayService[];
  announcements: Announcement[];
  onOpenTrackRequest: (trackingNumber?: string) => void;
}

export const ResidentHome: React.FC<ResidentHomeProps> = ({
  onNavigate,
  onSelectService,
  services,
  announcements,
  onOpenTrackRequest,
}) => {
  const [quickTrackingInput, setQuickTrackingInput] = React.useState('');

  const featuredServices = services.slice(0, 4);
  const urgentAnnouncement = announcements.find(a => a.priority === 'Urgent' && a.is_published);
  const regularAnnouncements = announcements.filter(a => a.id !== urgentAnnouncement?.id && a.is_published).slice(0, 2);

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTrackingInput.trim()) {
      onOpenTrackRequest(quickTrackingInput.trim());
    }
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Urgent Advisory Notice Banner if active */}
      {urgentAnnouncement && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-200 text-amber-900 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                Official Advisory
              </span>
              <h4 className="font-bold text-slate-900 text-sm">{urgentAnnouncement.title}</h4>
            </div>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed line-clamp-2">
              {urgentAnnouncement.content}
            </p>
          </div>
          <button
            onClick={() => onNavigate('announcements')}
            className="text-xs font-semibold text-amber-800 hover:text-amber-900 underline whitespace-nowrap self-center"
          >
            Read Bulletin
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 text-white p-6 sm:p-10 shadow-xl border border-emerald-700/50">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-emerald-700/60 border border-emerald-500/40 text-emerald-200 text-xs px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Welcome to the Official Portal of Barangay Camohaguin</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold font-serif tracking-tight text-white leading-tight">
            Fast, Transparent & Reliable Barangay Services
          </h1>
          <p className="mt-3 text-sm sm:text-base text-emerald-100/90 leading-relaxed font-normal">
            Request clearances, certificates, and welfare assistance directly from your home. Track application status in real-time or check your residency verification status securely.
          </p>

          {/* Quick Track Search inside Hero */}
          <form onSubmit={handleQuickTrack} className="mt-6 sm:mt-8 max-w-xl">
            <label className="block text-xs font-semibold text-emerald-200 mb-2 uppercase tracking-wider">
              Already submitted a request? Track it now:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Enter Tracking No. (e.g. BC-2026-0928-1002)"
                  value={quickTrackingInput}
                  onChange={e => setQuickTrackingInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-sm"
                />
              </div>
              <button
                type="submit"
                className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold px-5 py-2.5 rounded-lg text-sm transition shadow flex items-center justify-center gap-1.5"
              >
                <span>Track Status</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-emerald-200/80">
              <span>Try sample tracking numbers:</span>
              <button
                type="button"
                onClick={() => {
                  setQuickTrackingInput('BC-2026-0928-1002');
                  onOpenTrackRequest('BC-2026-0928-1002');
                }}
                className="underline hover:text-amber-300"
              >
                BC-2026-0928-1002
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setQuickTrackingInput('BC-2026-0928-1003');
                  onOpenTrackRequest('BC-2026-0928-1003');
                }}
                className="underline hover:text-amber-300"
              >
                BC-2026-0928-1003
              </button>
            </div>
          </form>
        </div>

        {/* Decorative background watermark */}
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none select-none">
          <Building className="w-96 h-96 text-white" />
        </div>
      </section>

      {/* 4 Primary Action Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('services')}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition text-left group hover:border-emerald-600 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3 group-hover:bg-emerald-800 group-hover:text-amber-300 transition">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Request a Service</h3>
            <p className="text-xs text-slate-500 mt-1">
              Apply online for Barangay Clearance, Certificate of Indigency, or Residency.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-emerald-700 flex items-center gap-1 group-hover:translate-x-1 transition">
            Browse Catalog <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>

        <button
          onClick={() => onNavigate('track')}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition text-left group hover:border-emerald-600 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center mb-3 group-hover:bg-blue-800 group-hover:text-white transition">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Track Request</h3>
            <p className="text-xs text-slate-500 mt-1">
              Check real-time evaluation status and document release schedule.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition">
            Lookup Request <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>

        <button
          onClick={() => onNavigate('verify-residency')}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition text-left group hover:border-emerald-600 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-3 group-hover:bg-amber-700 group-hover:text-white transition">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Residency Status</h3>
            <p className="text-xs text-slate-500 mt-1">
              Verify your official resident record in Barangay Camohaguin securely.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-amber-800 flex items-center gap-1 group-hover:translate-x-1 transition">
            Check Record <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>

        <button
          onClick={() => onNavigate('emergency')}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition text-left group hover:border-red-600 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center mb-3 group-hover:bg-red-700 group-hover:text-white transition">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Emergency Hotlines</h3>
            <p className="text-xs text-slate-500 mt-1">
              Direct access to Barangay Tanod, BFP, Police Station, and Health Center.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-red-700 flex items-center gap-1 group-hover:translate-x-1 transition">
            View Contacts <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>
      </section>

      {/* Popular Services Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-serif">Popular Citizen Services</h2>
            <p className="text-xs text-slate-500">Official documents and permits with transparent fees and processing times.</p>
          </div>
          <button
            onClick={() => onNavigate('services')}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
          >
            View All Services ({services.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredServices.map(service => (
            <div
              key={service.id}
              className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs hover:border-emerald-500 transition"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                    {service.code}
                  </span>
                  <span className="text-[11px] font-medium text-emerald-700">
                    {service.processing_days === 1 ? '1 Working Day' : `${service.processing_days} Working Days`}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{service.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                  {service.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Barangay Fee</span>
                  <span className="text-xs font-bold text-slate-800">
                    {service.fee_amount === 0 ? 'FREE' : `₱${service.fee_amount.toFixed(2)}`}
                  </span>
                </div>
                <button
                  onClick={() => onSelectService(service)}
                  className="bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-semibold px-3 py-1.5 rounded-lg text-xs transition"
                >
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works - 4 Steps */}
      <section className="bg-slate-100/80 rounded-2xl p-6 sm:p-8 border border-slate-200">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Service Process</span>
          <h2 className="text-xl font-bold text-slate-900 font-serif mt-1">How Online Requests Work</h2>
          <p className="text-xs text-slate-500 mt-1">
            Follow these 4 simple steps to submit and receive your official barangay documents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          <div className="bg-white p-5 rounded-xl border border-slate-200 relative">
            <span className="w-7 h-7 rounded-full bg-emerald-800 text-amber-300 font-bold text-xs flex items-center justify-center mb-3">
              1
            </span>
            <h4 className="font-bold text-sm text-slate-900 mb-1">Select Service</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Review required documents, eligibility rules, and barangay processing schedule.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 relative">
            <span className="w-7 h-7 rounded-full bg-emerald-800 text-amber-300 font-bold text-xs flex items-center justify-center mb-3">
              2
            </span>
            <h4 className="font-bold text-sm text-slate-900 mb-1">Residency Match</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Check residency against the official registry or file as an applicant with valid proof.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 relative">
            <span className="w-7 h-7 rounded-full bg-emerald-800 text-amber-300 font-bold text-xs flex items-center justify-center mb-3">
              3
            </span>
            <h4 className="font-bold text-sm text-slate-900 mb-1">Staff Evaluation</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Barangay Secretary reviews submitted details. Receive real-time progress updates.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 relative">
            <span className="w-7 h-7 rounded-full bg-emerald-800 text-amber-300 font-bold text-xs flex items-center justify-center mb-3">
              4
            </span>
            <h4 className="font-bold text-sm text-slate-900 mb-1">Claim Document</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Once "Ready for Release", visit the Barangay Hall releasing window with your tracking number.
            </p>
          </div>
        </div>
      </section>

      {/* Latest Announcements Teaser */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-serif">Official Community Bulletins</h2>
            <p className="text-xs text-slate-500">Stay informed with updates from the Sangguniang Barangay.</p>
          </div>
          <button
            onClick={() => onNavigate('announcements')}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
          >
            All Announcements <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {regularAnnouncements.map(item => (
            <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                    {item.category}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(item.published_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-2">{item.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {item.content}
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Issued by: <strong>{item.author_name}</strong></span>
                <button
                  onClick={() => onNavigate('announcements')}
                  className="text-emerald-700 font-semibold hover:underline"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
