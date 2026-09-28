import React from 'react';
import { PhoneCall, ShieldAlert, Flame, HeartPulse, Siren, Radio, MapPin } from 'lucide-react';

export const EmergencyContacts: React.FC = () => {
  const hotlines = [
    {
      category: 'Barangay First Responders',
      name: 'Barangay Camohaguin Tanod Command Outpost',
      number: '(042) 317-8890 / 0918-555-0101',
      description: '24/7 night patrol, public disturbance, dispute de-escalation, disaster alerts.',
      icon: ShieldAlert,
      color: 'border-emerald-300 bg-emerald-50/50 text-emerald-900',
      badge: '24/7 Active',
    },
    {
      category: 'Barangay Health & Ambulance',
      name: 'Camohaguin Barangay Health Station & BHW Response',
      number: '0920-777-0202',
      description: 'First aid, maternal emergencies, clinic triage, emergency transport coordination.',
      icon: HeartPulse,
      color: 'border-teal-300 bg-teal-50/50 text-teal-900',
      badge: 'BHW On-Call',
    },
    {
      category: 'Municipal Police Department',
      name: 'Gumaca Municipal Police Station (PNP)',
      number: '0998-598-5688 / (042) 317-5401',
      description: 'Criminal complaints, vehicular accidents, public safety enforcement.',
      icon: Siren,
      color: 'border-blue-300 bg-blue-50/50 text-blue-900',
      badge: 'Municipal Hotline',
    },
    {
      category: 'Fire Department',
      name: 'Bureau of Fire Protection (BFP) Gumaca',
      number: '(042) 317-5310 / 0915-444-0303',
      description: 'Structural fires, brushfires, chemical hazards, rescue extrication.',
      icon: Flame,
      color: 'border-red-300 bg-red-50/50 text-red-900',
      badge: 'Emergency Rescue',
    },
    {
      category: 'Disaster Risk Management',
      name: 'Gumaca MDRRMO / Emergency Operations Center',
      number: '(042) 317-6222 / 0917-888-0404',
      description: 'Typhoon advisories, storm surge alerts, flash flood evacuations.',
      icon: Radio,
      color: 'border-amber-300 bg-amber-50/50 text-amber-900',
      badge: 'MDRRMC Ops',
    },
    {
      category: 'Municipal Rural Health Unit',
      name: 'Gumaca RHU & Municipal Infirmary',
      number: '(042) 317-5221',
      description: 'Medical doctor consultations, animal bite center, emergency hospital transfers.',
      icon: HeartPulse,
      color: 'border-indigo-300 bg-indigo-50/50 text-indigo-900',
      badge: 'Rural Health',
    },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 bg-red-100 text-red-900 text-xs px-2.5 py-0.5 rounded-full font-bold mb-2">
          <PhoneCall className="w-3 h-3 text-red-700" />
          <span>Priority Contact Directory</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
          Emergency Hotlines & Disaster Contacts
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Direct telephone and cellular lines for immediate peace, medical, fire, and disaster assistance in Barangay Camohaguin.
        </p>
      </div>

      {/* Emergency Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hotlines.map(h => {
          const Icon = h.icon;
          return (
            <div
              key={h.name}
              className={`rounded-2xl border p-5 shadow-xs flex flex-col justify-between ${h.color}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                    {h.category}
                  </span>
                  <span className="text-[10px] font-extrabold bg-white/80 px-2 py-0.5 rounded shadow-2xs">
                    {h.badge}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white shadow-xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base leading-snug">{h.name}</h3>
                    <p className="text-xs opacity-85 mt-1 leading-relaxed">{h.description}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-current/15 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold opacity-70 block">Dial Direct</span>
                  <span className="font-mono text-sm sm:text-base font-extrabold tracking-wide">
                    {h.number}
                  </span>
                </div>
                <a
                  href={`tel:${h.number.split('/')[0].trim()}`}
                  className="px-3.5 py-1.5 bg-white font-bold text-xs rounded-lg shadow-xs hover:bg-slate-50 transition flex items-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Now</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Evacuation Centers and Assembly Point */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-800" />
          <h2 className="text-base font-bold font-serif text-slate-900">
            Designated Community Evacuation Centers
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-900 block mb-0.5">Primary: Camohaguin Covered Court</span>
            <span className="text-slate-500">Purok 3 Sentro • Capacity: 450 persons • Generator equipped</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-900 block mb-0.5">Secondary: Camohaguin Elementary School</span>
            <span className="text-slate-500">Purok 2 • Capacity: 300 persons • Clean water storage</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-900 block mb-0.5">Tertiary: Hilltop Daycare Complex</span>
            <span className="text-slate-500">Purok 7 Upland • High-ground typhoon shelter</span>
          </div>
        </div>
      </div>
    </div>
  );
};
