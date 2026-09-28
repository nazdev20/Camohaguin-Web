import React from 'react';
import { Building2, Users, MapPin, Award, Compass, Shield, HeartHandshake } from 'lucide-react';

export const BarangayInfo: React.FC = () => {
  const officials = [
    { name: 'Hon. Rodrigo M. Castillo', role: 'Punong Barangay / Barangay Captain', committee: 'Executive / Presiding Officer' },
    { name: 'Hon. Maria Clara B. Santos', role: 'Barangay Kagawad', committee: 'Committee on Peace and Order, Public Safety' },
    { name: 'Hon. Danilo G. Alcantara', role: 'Barangay Kagawad', committee: 'Committee on Infrastructure and Public Works' },
    { name: 'Hon. Teresa L. Delos Reyes', role: 'Barangay Kagawad', committee: 'Committee on Health, Sanitation and Social Welfare' },
    { name: 'Hon. Roberto C. Mendoza', role: 'Barangay Kagawad', committee: 'Committee on Agriculture and Fisheries' },
    { name: 'Hon. Vivian P. Mercado', role: 'Barangay Kagawad', committee: 'Committee on Education, Culture and Women' },
    { name: 'Hon. Francis J. Navarro', role: 'Barangay Kagawad', committee: 'Committee on Appropriations, Finance and Ways & Means' },
    { name: 'Hon. Kevin R. Morales', role: 'SK Chairperson', committee: 'Committee on Youth and Sports Development' },
    { name: 'Elena S. Ramos', role: 'Barangay Secretary', committee: 'Secretariat, Civil Registry & Records' },
    { name: 'Carlos T. Villanueva', role: 'Barangay Treasurer', committee: 'Treasury, Revenue Collection & Disbursement' },
  ];

  const puroks = [
    { name: 'Purok 1', alias: 'Ilaya', desc: 'Commercial corridor, Barangay Hall, and main transport terminal.' },
    { name: 'Purok 2', alias: 'Sentro Proper', desc: 'Residential center, Elementary School, and Multi-purpose plaza.' },
    { name: 'Purok 3', alias: 'San Isidro', desc: 'Covered basketball court, community daycare center.' },
    { name: 'Purok 4', alias: 'Coconut Grove', desc: 'Agricultural belt and coconut farming cooperative.' },
    { name: 'Purok 5', alias: 'Ibaba / Riverside', desc: 'Riverside residential clusters and Materials Recovery Facility.' },
    { name: 'Purok 6', alias: 'Coastal Area', desc: 'Fisherfolk community, boat anchorage, and sea breeze boulevard.' },
    { name: 'Purok 7', alias: 'Hilltop / Bukid', desc: 'Upland zone, agro-forestry, and scenic barangay boundary.' },
  ];

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
          About Barangay Camohaguin
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Barangay profile, leadership roster, territorial jurisdiction, and governance charter in Gumaca, Quezon.
        </p>
      </div>

      {/* Vision & Mission */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-900 text-white p-6 rounded-2xl border border-emerald-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>Our Vision</span>
          </div>
          <h3 className="font-serif font-bold text-lg">A Resilient & Progressive Community</h3>
          <p className="text-xs text-emerald-100 leading-relaxed">
            Barangay Camohaguin envisions itself as a united, ecologically sustainable, and peaceful community 
            with God-fearing, empowered, and healthy citizens living under transparent and participatory leadership.
          </p>
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Award className="w-4 h-4" />
            <span>Our Mission</span>
          </div>
          <h3 className="font-serif font-bold text-lg">Dedicated Public Service Excellence</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            To provide efficient, equitable, and technology-driven social services, uphold peace and order through 
            Katarungang Pambarangay, promote economic self-reliance, and protect community welfare.
          </p>
        </div>
      </div>

      {/* Officials Roster */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-800" />
            <h2 className="text-lg font-bold font-serif text-slate-900">
              Sangguniang Barangay (Elected & Appointed Officials)
            </h2>
          </div>
          <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded">
            Term 2023–2026
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {officials.map(official => (
            <div
              key={official.name}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-800 text-amber-300 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                {official.name.split(' ').slice(-1)[0][0]}
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900">{official.name}</h4>
                <p className="text-xs text-emerald-800 font-semibold">{official.role}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{official.committee}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Territorial Jurisdiction & Purok Guide */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-800" />
          <h2 className="text-lg font-bold font-serif text-slate-900">
            Territorial Puroks & Zones
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Barangay Camohaguin is strategically divided into 7 constituent Puroks for governance, waste management, and peace patrol dispatch.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {puroks.map(p => (
            <div key={p.name} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-emerald-900">{p.name}</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">
                  {p.alias}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
