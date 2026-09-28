import React, { useState } from 'react';
import { Project, PublicDocument } from '../../types/schema';
import { FolderOpen, Briefcase, FileText, CheckCircle2, Clock, Calendar, Download } from 'lucide-react';

interface AdminDocumentsProjectsProps {
  documents: PublicDocument[];
  projects: Project[];
}

export const AdminDocumentsProjects: React.FC<AdminDocumentsProjectsProps> = ({
  documents,
  projects,
}) => {
  const [tab, setTab] = useState<'docs' | 'projects'>('docs');

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
            Public Documents & Infrastructure Projects
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Transparency repository: Barangay Ordinances, Resolutions, Annual Budget Reports, and Capital Outlays.
          </p>
        </div>

        <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs self-start sm:self-auto">
          <button
            onClick={() => setTab('docs')}
            className={`px-4 py-1.5 font-bold rounded-md transition ${
              tab === 'docs' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-600'
            }`}
          >
            Public Documents ({documents.length})
          </button>
          <button
            onClick={() => setTab('projects')}
            className={`px-4 py-1.5 font-bold rounded-md transition ${
              tab === 'projects' ? 'bg-white text-emerald-950 shadow-xs' : 'text-slate-600'
            }`}
          >
            Barangay Projects ({projects.length})
          </button>
        </div>
      </div>

      {tab === 'docs' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                  <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                    {doc.reference_number}
                  </span>
                  <span className="text-slate-400 font-medium">FY {doc.fiscal_year}</span>
                </div>

                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mb-1.5">
                  {doc.category}
                </span>

                <h3 className="font-bold text-slate-900 text-sm mb-2">{doc.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                  {doc.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Published: {doc.published_at}</span>
                <span className="text-emerald-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer">
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF Document</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(proj => (
            <div
              key={proj.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-500">{proj.purok_location}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      proj.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-900'
                        : proj.status === 'Ongoing'
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {proj.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1.5 leading-snug">{proj.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{proj.description}</p>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5 text-xs mb-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Allocated Budget:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      ₱{proj.budget_allocated.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Timeline:</span>
                    <span className="font-semibold text-slate-700">
                      {proj.start_date} to {proj.target_completion_date || 'TBD'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Person-in-Charge:</span>
                    <span className="font-semibold text-slate-700">{proj.person_in_charge}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
