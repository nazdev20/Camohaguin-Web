import React, { useState } from 'react';
import { BarangayDatabase } from '../../services/db';
import { Household, Resident, ResidencyStatus } from '../../types/schema';
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Filter,
  Home,
  X,
  Edit2
} from 'lucide-react';

interface AdminResidentsProps {
  residents: Resident[];
  households: Household[];
  onRefresh: () => void;
}

export const AdminResidents: React.FC<AdminResidentsProps> = ({
  residents,
  households,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [purokFilter, setPurokFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Edit / Verify modal
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [newStatus, setNewStatus] = useState<ResidencyStatus>('verified');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  const handleOpenVerify = (resident: Resident) => {
    setSelectedResident(resident);
    setNewStatus(resident.residency_status);
    setRemarks(resident.remarks || '');
  };

  const handleSaveResidency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident) return;

    setSaving(true);
    try {
      BarangayDatabase.updateResidentStatus(selectedResident.resident_id, newStatus, remarks);
      onRefresh();
      setSelectedResident(null);
    } finally {
      setSaving(false);
    }
  };

  const filteredResidents = residents.filter(res => {
    const fullName = `${res.first_name} ${res.middle_name || ''} ${res.last_name} ${res.suffix || ''}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      res.resident_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPurok = purokFilter === 'All' || res.purok_zone === purokFilter;
    const matchesStatus = statusFilter === 'All' || res.residency_status === statusFilter;

    return matchesSearch && matchesPurok && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              Classified Internal Registry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 mt-1">
            Barangay Resident Registry
          </h1>
          <p className="text-sm text-slate-600">
            Internal masterlist of bona fide residents, household linkage, and residency verification statuses.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search resident name, Resident ID (e.g. BC-RES-00101), address..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white font-semibold text-slate-700"
          >
            <option value="All">All Statuses ({residents.length})</option>
            <option value="verified">Verified ({residents.filter(r => r.residency_status === 'verified').length})</option>
            <option value="unverified">Unverified ({residents.filter(r => r.residency_status === 'unverified').length})</option>
            <option value="inactive">Inactive</option>
            <option value="transferred">Transferred</option>
          </select>

          {/* Purok filter */}
          <select
            value={purokFilter}
            onChange={e => setPurokFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white text-slate-700"
          >
            <option value="All">All Puroks</option>
            <option value="Purok 1">Purok 1</option>
            <option value="Purok 2">Purok 2</option>
            <option value="Purok 3">Purok 3</option>
            <option value="Purok 4">Purok 4</option>
            <option value="Purok 5">Purok 5</option>
            <option value="Purok 6">Purok 6</option>
            <option value="Purok 7">Purok 7</option>
          </select>
        </div>
      </div>

      {/* Resident Registry Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Resident System ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Birth Date / Age</th>
                <th className="py-3 px-4">Purok & Street Address</th>
                <th className="py-3 px-4">Household Number</th>
                <th className="py-3 px-4">Residency Status</th>
                <th className="py-3 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No resident records found.
                  </td>
                </tr>
              ) : (
                filteredResidents.map(res => {
                  const household = households.find(h => h.household_id === res.household_id);
                  const birthYear = new Date(res.birth_date).getFullYear();
                  const age = new Date().getFullYear() - birthYear;

                  return (
                    <tr key={res.resident_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {res.resident_id}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {res.first_name} {res.middle_name || ''} {res.last_name} {res.suffix || ''}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {res.gender} • {res.civil_status} • Voter: {res.is_registered_voter ? 'Yes' : 'No'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <div>{res.birth_date}</div>
                        <div className="text-[11px] text-slate-400 font-medium">({age} yrs old)</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{res.purok_zone}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{res.address}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {household ? (
                          <div className="text-slate-700 font-mono font-semibold">
                            {household.household_number}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                            res.residency_status === 'verified'
                              ? 'bg-emerald-100 text-emerald-900'
                              : res.residency_status === 'unverified'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {res.residency_status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenVerify(res)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3 text-slate-600" />
                          <span>Update Status</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verify / Update Residency Modal */}
      {selectedResident && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-900 text-white p-5 flex justify-between items-start">
              <div>
                <span className="font-mono text-xs font-bold bg-emerald-800 text-amber-300 px-2 py-0.5 rounded border border-emerald-700">
                  {selectedResident.resident_id}
                </span>
                <h3 className="text-lg font-bold font-serif mt-1">
                  Residency Verification & Status
                </h3>
                <p className="text-xs text-emerald-200">
                  Resident: <strong>{selectedResident.first_name} {selectedResident.last_name}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedResident(null)}
                className="text-emerald-300 hover:text-white p-1 rounded-full hover:bg-emerald-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResidency} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Address:</span>
                  <span className="font-semibold text-slate-800">{selectedResident.address}, {selectedResident.purok_zone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date of Birth:</span>
                  <span className="font-semibold text-slate-800">{selectedResident.birth_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Registered Voter:</span>
                  <span className="font-semibold text-slate-800">{selectedResident.is_registered_voter ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wide">
                  Residency Status *
                </label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as ResidencyStatus)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white font-bold"
                >
                  <option value="verified">Verified (Officially confirmed resident)</option>
                  <option value="unverified">Unverified (Pending physical inspection or documents)</option>
                  <option value="inactive">Inactive (Living elsewhere temporarily)</option>
                  <option value="transferred">Transferred (Moved out of Barangay Camohaguin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Verification Remarks / Notes
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="e.g. Verified by Purok Leader via household visit; Head of family; Clean barangay clearance..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedResident(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-bold rounded-lg transition shadow"
                >
                  {saving ? 'Saving...' : 'Save Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
