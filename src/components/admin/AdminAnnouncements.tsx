import React, { useState } from 'react';
import { BarangayDatabase } from '../../services/db';
import { Announcement, PriorityLevel } from '../../types/schema';
import { Megaphone, Plus, Edit2, Calendar, User, Eye, EyeOff, X } from 'lucide-react';

interface AdminAnnouncementsProps {
  announcements: Announcement[];
  onRefresh: () => void;
}

export const AdminAnnouncements: React.FC<AdminAnnouncementsProps> = ({
  announcements,
  onRefresh,
}) => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Public Advisory');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('Normal');
  const [targetAudience, setTargetAudience] = useState('All Residents');
  const [isPublished, setIsPublished] = useState(true);

  const handleOpenCreate = () => {
    setSelectedAnnouncement(null);
    setTitle('');
    setCategory('Public Advisory');
    setContent('');
    setPriority('Normal');
    setTargetAudience('All Residents');
    setIsPublished(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Announcement) => {
    setSelectedAnnouncement(item);
    setTitle(item.title);
    setCategory(item.category);
    setContent(item.content);
    setPriority(item.priority);
    setTargetAudience(item.target_audience);
    setIsPublished(item.is_published);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const activeAdmin = BarangayDatabase.getActiveAdmin();

    const data: Announcement = {
      id: selectedAnnouncement ? selectedAnnouncement.id : `n-${Date.now()}`,
      title: title.trim(),
      category,
      content: content.trim(),
      priority,
      target_audience: targetAudience,
      is_published: isPublished,
      published_at: selectedAnnouncement ? selectedAnnouncement.published_at : new Date().toISOString(),
      author_name: selectedAnnouncement ? selectedAnnouncement.author_name : activeAdmin.full_name,
      created_at: selectedAnnouncement ? selectedAnnouncement.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    BarangayDatabase.saveAnnouncement(data);
    onRefresh();
    setIsModalOpen(false);
  };

  const handleTogglePublish = (item: Announcement) => {
    BarangayDatabase.saveAnnouncement({
      ...item,
      is_published: !item.is_published,
    });
    onRefresh();
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
            Announcements & Bulletins
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Broadcast emergency alerts, public advisories, and assembly notices to citizens.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-bold px-4 py-2 rounded-lg text-xs transition shadow flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Bulletin</span>
        </button>
      </div>

      <div className="space-y-4">
        {announcements.map(item => (
          <div
            key={item.id}
            className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              !item.is_published ? 'opacity-60 bg-slate-50' : ''
            }`}
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    item.priority === 'Urgent'
                      ? 'bg-amber-100 text-amber-900 font-extrabold'
                      : item.priority === 'Advisory'
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {item.priority}
                </span>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  {item.category}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    item.is_published ? 'text-emerald-700 bg-emerald-50' : 'text-slate-400 bg-slate-100'
                  }`}
                >
                  {item.is_published ? 'Published' : 'Draft / Hidden'}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{item.content}</p>

              <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                <span>Issued by: <strong>{item.author_name}</strong></span>
                <span>•</span>
                <span>Published: {new Date(item.published_at).toLocaleDateString('en-PH')}</span>
                <span>•</span>
                <span>Target: {item.target_audience}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              <button
                type="button"
                onClick={() => handleTogglePublish(item)}
                className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
                  item.is_published
                    ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                    : 'border-emerald-300 text-emerald-800 bg-emerald-50'
                }`}
                title={item.is_published ? 'Unpublish' : 'Publish'}
              >
                {item.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{item.is_published ? 'Hide' : 'Publish'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenEdit(item)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3 text-slate-600" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-900 text-white p-5 flex justify-between items-center">
              <h3 className="text-base font-bold font-serif">
                {selectedAnnouncement ? 'Edit Bulletin' : 'Create Barangay Bulletin'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Schedule of Annual Rabies Vaccination"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="General Assembly">General Assembly</option>
                    <option value="Public Advisory">Public Advisory</option>
                    <option value="Health & Wellness">Health & Wellness</option>
                    <option value="Sanitation & Environment">Sanitation & Environment</option>
                    <option value="Disaster Preparedness">Disaster Preparedness</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Priority Level</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-bold"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Advisory">Advisory</option>
                    <option value="Urgent">Urgent (Shows top warning)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Audience</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value)}
                  placeholder="e.g. All Residents & Household Heads"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Content Body *</label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Complete text of bulletin..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pubCheck"
                  checked={isPublished}
                  onChange={e => setIsPublished(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-600"
                />
                <label htmlFor="pubCheck" className="text-slate-800 font-semibold cursor-pointer">
                  Publish immediately to Citizen Portal
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 text-amber-300 font-bold rounded-lg hover:bg-emerald-900"
                >
                  Save Bulletin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
