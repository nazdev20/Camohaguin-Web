import React, { useState } from 'react';
import { Announcement } from '../../types/schema';
import { Megaphone, AlertCircle, Calendar, User, Search, Tag } from 'lucide-react';

interface AnnouncementsViewProps {
  announcements: Announcement[];
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({ announcements }) => {
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [search, setSearch] = useState('');

  const filtered = announcements.filter(item => {
    if (!item.is_published) return false;
    const matchesPriority = filterPriority === 'All' || item.priority === filterPriority;
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
          Official Barangay Announcements
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Public advisories, community assemblies, health campaigns, and disaster preparedness circulars from Barangay Camohaguin.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search bulletins and circulars..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['All', 'Urgent', 'Advisory', 'Normal'].map(pri => (
            <button
              key={pri}
              onClick={() => setFilterPriority(pri)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterPriority === pri
                  ? 'bg-emerald-800 text-amber-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {pri}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filtered.map(item => (
          <article
            key={item.id}
            className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs space-y-3 transition ${
              item.priority === 'Urgent'
                ? 'border-amber-300 bg-amber-50/20'
                : 'border-slate-200'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded ${
                    item.priority === 'Urgent'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : item.priority === 'Advisory'
                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {item.priority}
                </span>
                <span className="text-xs font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                  {item.category}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {new Date(item.published_at).toLocaleDateString('en-PH', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-bold font-serif text-slate-900 leading-snug">
              {item.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {item.content}
            </p>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Issued by: <strong>{item.author_name}</strong></span>
              </span>
              <span className="text-[11px] text-slate-400">
                Target Audience: {item.target_audience}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
