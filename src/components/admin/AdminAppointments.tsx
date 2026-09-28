import React, { useState } from 'react';
import { BarangayDatabase } from '../../services/db';
import { Appointment } from '../../types/schema';
import { Calendar, Clock, CheckCircle2, XCircle, User, Phone, Edit2, X } from 'lucide-react';

interface AdminAppointmentsProps {
  appointments: Appointment[];
  onRefresh: () => void;
}

export const AdminAppointments: React.FC<AdminAppointmentsProps> = ({
  appointments,
  onRefresh,
}) => {
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [newStatus, setNewStatus] = useState<Appointment['status']>('Scheduled');
  const [notes, setNotes] = useState('');

  const handleOpenUpdate = (apt: Appointment) => {
    setSelectedApt(apt);
    setNewStatus(apt.status);
    setNotes(apt.notes || '');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApt) return;

    BarangayDatabase.updateAppointmentStatus(selectedApt.id, newStatus, notes);
    onRefresh();
    setSelectedApt(null);
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
          Appointments & Hearing Schedule
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Daily calendar of in-person citizen claims, dry-seal certifications, and Lupon hearings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {appointments.map(apt => (
          <div
            key={apt.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-slate-500">
                  {apt.appointment_number}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    apt.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-900'
                      : apt.status === 'Cancelled'
                      ? 'bg-red-100 text-red-900'
                      : 'bg-blue-100 text-blue-900'
                  }`}
                >
                  {apt.status}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-base mb-1">{apt.full_name}</h3>
              <p className="text-xs text-emerald-800 font-semibold mb-2">{apt.service_name}</p>

              <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Scheduled: <strong>{apt.scheduled_date}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Time: <strong>{apt.time_slot}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Contact: {apt.contact_number}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                Purpose: {apt.purpose}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => handleOpenUpdate(apt)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3 text-slate-600" />
                <span>Update Schedule</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Update Modal */}
      {selectedApt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-900 text-white p-5 flex justify-between items-start">
              <div>
                <span className="font-mono text-xs text-emerald-300 font-bold">
                  {selectedApt.appointment_number}
                </span>
                <h3 className="text-base font-bold font-serif mt-1">
                  Update Appointment: {selectedApt.full_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedApt(null)}
                className="text-emerald-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as Appointment['status'])}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white font-semibold"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Rescheduled">Rescheduled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Staff Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Record outcome of appointment or rescheduling reason..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApt(null)}
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
