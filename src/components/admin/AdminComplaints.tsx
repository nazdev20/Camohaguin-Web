import React, { useState } from 'react';
import { BarangayDatabase } from '../../services/db';
import { Complaint, ComplaintStatus } from '../../types/schema';
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  Calendar,
  Lock,
  Plus,
  X,
  Edit2,
  User
} from 'lucide-react';

interface AdminComplaintsProps {
  complaints: Complaint[];
  onRefresh: () => void;
}

export const AdminComplaints: React.FC<AdminComplaintsProps> = ({ complaints, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // New complaint modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [complainantName, setComplainantName] = useState('');
  const [complainantContact, setComplainantContact] = useState('');
  const [complainantPurok, setComplainantPurok] = useState('Purok 1');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [category, setCategory] = useState('Neighborhood Dispute');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [incidentLocation, setIncidentLocation] = useState('');
  const [description, setDescription] = useState('');
  const [assignedOfficer, setAssignedOfficer] = useState('Hon. Rodrigo M. Castillo');

  // Update status modal
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [updateStatus, setUpdateStatus] = useState<ComplaintStatus>('Open');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [officerNote, setOfficerNote] = useState('');

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    BarangayDatabase.createComplaint({
      complainant_name: isAnonymous ? 'Confidential Complainant' : complainantName.trim(),
      complainant_contact: complainantContact.trim(),
      complainant_purok: complainantPurok,
      is_anonymous: isAnonymous,
      category,
      incident_date: incidentDate,
      incident_location: incidentLocation.trim(),
      description: description.trim(),
      status: 'Open',
      assigned_officer: assignedOfficer,
    });

    onRefresh();
    setShowAddModal(false);
    // reset form
    setComplainantName('');
    setDescription('');
    setIncidentLocation('');
  };

  const handleOpenUpdate = (c: Complaint) => {
    setSelectedComplaint(c);
    setUpdateStatus(c.status);
    setResolutionNotes(c.resolution_notes || '');
    setOfficerNote(c.assigned_officer || '');
  };

  const handleSaveUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    BarangayDatabase.updateComplaintStatus(
      selectedComplaint.id,
      updateStatus,
      resolutionNotes,
      officerNote
    );

    onRefresh();
    setSelectedComplaint(null);
  };

  const filtered = complaints.filter(c => {
    const matchesSearch =
      c.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.complainant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
            Katarungang Pambarangay / Blotter
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Peace and order incident tickets, community grievances, and Lupon Tagapamayapa mediation cases.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-bold px-4 py-2 rounded-lg text-xs transition shadow flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Lodge Incident Ticket</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search blotter tickets, parties, category..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-semibold text-slate-700"
        >
          <option value="All">All Statuses ({complaints.length})</option>
          <option value="Open">Open</option>
          <option value="Under Investigation">Under Investigation</option>
          <option value="Mediation Scheduled">Mediation Scheduled</option>
          <option value="Resolved">Resolved</option>
          <option value="Dismissed">Dismissed</option>
        </select>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {filtered.map(item => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                  {item.ticket_number}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.status === 'Resolved'
                      ? 'bg-emerald-100 text-emerald-900'
                      : item.status === 'Mediation Scheduled'
                      ? 'bg-purple-100 text-purple-900'
                      : item.status === 'Under Investigation'
                      ? 'bg-amber-100 text-amber-900'
                      : item.status === 'Dismissed'
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-red-100 text-red-900'
                  }`}
                >
                  {item.status}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  {item.category}
                </span>
                {item.is_anonymous && (
                  <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-200 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    Confidential
                  </span>
                )}
              </div>

              <h3 className="font-bold text-slate-900 text-sm">
                Complainant: {item.is_anonymous ? 'Protected Identity' : item.complainant_name} ({item.complainant_purok || 'Camohaguin'})
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                {item.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                <span>Incident Date: {item.incident_date}</span>
                <span>•</span>
                <span>Location: {item.incident_location}</span>
                <span>•</span>
                <span>Assigned: <strong>{item.assigned_officer || 'Desk Officer'}</strong></span>
              </div>

              {item.resolution_notes && (
                <div className="bg-emerald-50/70 p-2 rounded text-[11px] text-emerald-900 border border-emerald-200/60 mt-1">
                  <strong>Resolution:</strong> {item.resolution_notes}
                </div>
              )}
            </div>

            <button
              onClick={() => handleOpenUpdate(item)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition self-end md:self-center"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Update Case</span>
            </button>
          </div>
        ))}
      </div>

      {/* New Complaint Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-900 text-white p-5 flex justify-between items-center">
              <h3 className="text-base font-bold font-serif">Lodge Barangay Blotter / Complaint</h3>
              <button onClick={() => setShowAddModal(false)} className="text-emerald-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} className="p-5 space-y-3.5 text-xs">
              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="anonCheck"
                  checked={isAnonymous}
                  onChange={e => setIsAnonymous(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-600"
                />
                <label htmlFor="anonCheck" className="font-semibold text-slate-800 cursor-pointer">
                  Confidential / Anonymous Complainant (Withholds name on public records)
                </label>
              </div>

              {!isAnonymous && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Complainant Name *</label>
                    <input
                      type="text"
                      required
                      value={complainantName}
                      onChange={e => setComplainantName(e.target.value)}
                      placeholder="Full name"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Contact No.</label>
                    <input
                      type="text"
                      value={complainantContact}
                      onChange={e => setComplainantContact(e.target.value)}
                      placeholder="0917-..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Purok</label>
                  <select
                    value={complainantPurok}
                    onChange={e => setComplainantPurok(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="Purok 1">Purok 1</option>
                    <option value="Purok 2">Purok 2</option>
                    <option value="Purok 3">Purok 3</option>
                    <option value="Purok 4">Purok 4</option>
                    <option value="Purok 5">Purok 5</option>
                    <option value="Purok 6">Purok 6</option>
                    <option value="Purok 7">Purok 7</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="Neighborhood Dispute">Neighborhood Dispute</option>
                    <option value="Noise Disturbance">Noise Disturbance</option>
                    <option value="Property & Boundary">Property & Boundary</option>
                    <option value="Sanitation & Drainage">Sanitation & Drainage</option>
                    <option value="Stray Animals">Stray Animals</option>
                    <option value="Peace & Order">Peace & Order</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Incident Date *</label>
                  <input
                    type="date"
                    required
                    value={incidentDate}
                    onChange={e => setIncidentDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Incident Location *</label>
                  <input
                    type="text"
                    required
                    value={incidentLocation}
                    onChange={e => setIncidentLocation(e.target.value)}
                    placeholder="e.g. Near Basketball Court"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Incident Summary & Complaint Details *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="State the facts clearly..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 text-amber-300 font-bold rounded-lg hover:bg-emerald-900"
                >
                  File Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Complaint Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-900 text-white p-5 flex justify-between items-start">
              <div>
                <span className="font-mono text-xs text-amber-300 font-bold">
                  {selectedComplaint.ticket_number}
                </span>
                <h3 className="text-base font-bold font-serif mt-1">
                  Update Case Status
                </h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-emerald-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUpdate} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Status</label>
                <select
                  value={updateStatus}
                  onChange={e => setUpdateStatus(e.target.value as ComplaintStatus)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white font-semibold"
                >
                  <option value="Open">Open</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Mediation Scheduled">Mediation Scheduled</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Dismissed">Dismissed</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assigned Officer / Kagawad</label>
                <input
                  type="text"
                  value={officerNote}
                  onChange={e => setOfficerNote(e.target.value)}
                  placeholder="Officer name"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Resolution / Action Taken</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  placeholder="Document conciliation agreement, verbal agreement, or Tanod dispatch report..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 text-amber-300 font-bold rounded-lg hover:bg-emerald-900"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
