import React, { useState } from 'react';
import { BarangayDatabase } from '../../services/db';
import { BarangayService } from '../../types/schema';
import { Briefcase, Plus, Edit2, Check, X, Clock, FileCheck, Power } from 'lucide-react';

interface AdminServicesProps {
  services: BarangayService[];
  onRefresh: () => void;
}

export const AdminServices: React.FC<AdminServicesProps> = ({ services, onRefresh }) => {
  const [selectedService, setSelectedService] = useState<BarangayService | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Certifications & Clearances');
  const [description, setDescription] = useState('');
  const [processingDays, setProcessingDays] = useState(1);
  const [feeAmount, setFeeAmount] = useState(50.0);
  const [requiresResidency, setRequiresResidency] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const handleOpenEdit = (svc: BarangayService) => {
    setSelectedService(svc);
    setName(svc.name);
    setCode(svc.code);
    setCategory(svc.category);
    setDescription(svc.description);
    setProcessingDays(svc.processing_days);
    setFeeAmount(svc.fee_amount);
    setRequiresResidency(svc.requires_residency_verification);
    setIsActive(svc.is_active);
    setIsEditing(true);
  };

  const handleOpenCreate = () => {
    setSelectedService(null);
    setName('');
    setCode(`BC-${Date.now().toString().slice(-3)}`);
    setCategory('Certifications & Clearances');
    setDescription('');
    setProcessingDays(1);
    setFeeAmount(0.0);
    setRequiresResidency(true);
    setIsActive(true);
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const serviceToSave: BarangayService = {
      id: selectedService ? selectedService.id : `s-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category,
      description: description.trim(),
      processing_days: Number(processingDays),
      fee_amount: Number(feeAmount),
      requires_residency_verification: requiresResidency,
      is_active: isActive,
      requirements: selectedService?.requirements || [
        {
          id: `req-${Date.now()}`,
          service_id: selectedService ? selectedService.id : '',
          requirement_name: 'Valid Government Issued ID',
          is_mandatory: true,
          file_type_hint: 'PDF, JPG, PNG',
        },
      ],
      created_at: selectedService ? selectedService.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    BarangayDatabase.saveService(serviceToSave);
    onRefresh();
    setIsEditing(false);
  };

  const handleToggleActive = (svc: BarangayService) => {
    BarangayDatabase.saveService({
      ...svc,
      is_active: !svc.is_active,
    });
    onRefresh();
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
            Services Configuration
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage citizen service catalog, processing turnaround schedules, and barangay fees.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-bold px-4 py-2 rounded-lg text-xs transition shadow flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(svc => (
          <div
            key={svc.id}
            className={`rounded-xl border p-5 shadow-xs flex flex-col justify-between transition ${
              svc.is_active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                  {svc.code}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    svc.is_active ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {svc.is_active ? 'Active' : 'Disabled'}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-base mb-1">{svc.name}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                {svc.description}
              </p>

              <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Processing Time:</span>
                  <span className="font-semibold text-slate-700">{svc.processing_days} Working Day(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Official Fee:</span>
                  <span className="font-bold text-slate-900">
                    {(svc.fee_amount ?? 0) === 0 ? 'FREE' : `₱${Number(svc.fee_amount ?? 0).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Requires Verification:</span>
                  <span className="font-semibold text-slate-700">
                    {svc.requires_residency_verification ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleToggleActive(svc)}
                className={`text-xs font-semibold px-2.5 py-1 rounded transition ${
                  svc.is_active ? 'text-red-700 hover:bg-red-50' : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                {svc.is_active ? 'Deactivate' : 'Activate'}
              </button>

              <button
                type="button"
                onClick={() => handleOpenEdit(svc)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3 text-slate-600" />
                <span>Edit Service</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Add Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-900 text-white p-5 flex justify-between items-center">
              <h3 className="text-base font-bold font-serif">
                {selectedService ? 'Edit Service' : 'Add New Barangay Service'}
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-emerald-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Service Title *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Service Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  <option value="Certifications & Clearances">Certifications & Clearances</option>
                  <option value="Social & Welfare Assistance">Social & Welfare Assistance</option>
                  <option value="Commercial & Permits">Commercial & Permits</option>
                  <option value="Youth & Employment">Youth & Employment</option>
                  <option value="Peace, Order & Justice">Peace, Order & Justice</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description *</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Processing Days</label>
                  <input
                    type="number"
                    min={0}
                    value={processingDays}
                    onChange={e => setProcessingDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Fee (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={feeAmount}
                    onChange={e => setFeeAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="reqResCheck"
                    checked={requiresResidency}
                    onChange={e => setRequiresResidency(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <label htmlFor="reqResCheck" className="text-slate-800 font-semibold cursor-pointer">
                    Requires Verified Residency in Barangay Camohaguin
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activeCheck"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <label htmlFor="activeCheck" className="text-slate-800 font-semibold cursor-pointer">
                    Service is Active and visible to residents
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 text-amber-300 font-bold rounded-lg hover:bg-emerald-900"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
