import React from 'react';
import { ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Barangay Identity */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-800 border border-amber-400 flex items-center justify-center font-bold text-amber-300 font-serif">
                BC
              </div>
              <span className="font-extrabold text-white text-base tracking-wide font-serif">
                BARANGAY CAMOHAGUIN
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Official digital citizen service portal providing prompt, transparent, and accountable public assistance for the residents of Barangay Camohaguin, Gumaca, Quezon.
            </p>
            <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Katarungan, Kaayusan, at Kaunlaran</span>
            </div>
          </div>

          {/* Col 2: Frontline Office Hours */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider text-amber-400">
              Office Hours & Location
            </h4>
            <div className="space-y-1.5 text-xs text-slate-300">
              <p className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Barangay Hall, Sentro, Barangay Camohaguin, Gumaca, Quezon 4307</span>
              </p>
              <p className="text-slate-400 pt-1">
                <strong>Monday to Friday:</strong> 8:00 AM – 5:00 PM
              </p>
              <p className="text-slate-400">
                <strong>Tanod Desk (24/7):</strong> Round-the-clock emergency response
              </p>
            </div>
          </div>

          {/* Col 3: Emergency Quick Contacts */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider text-amber-400">
              Emergency Hotlines
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-red-400" />
                <span>Tanod Command: <strong>(042) 317-8890</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span>PNP Gumaca: <strong>0998-598-5688</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>RHU Health Center: <strong>(042) 317-5221</strong></span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>secretariat@camohaguin.gov.ph</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Privacy & Standards */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider text-amber-400">
              Data Privacy & Security
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compliant with Republic Act No. 10173 (Data Privacy Act of 2012). Resident records are safeguarded and strictly reserved for authorized validation and document issuance.
            </p>
            <div className="pt-2 text-[11px] text-slate-500">
              Internal System Architecture: Normalized PostgreSQL • Supabase Schema
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Barangay Camohaguin, Municipality of Gumaca. All rights reserved.</p>
          <div className="flex gap-4 mt-2 sm:mt-0 text-[11px]">
            <span>Transparency Seal</span>
            <span>•</span>
            <span>Citizen's Charter</span>
            <span>•</span>
            <span>Katarungang Pambarangay</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
