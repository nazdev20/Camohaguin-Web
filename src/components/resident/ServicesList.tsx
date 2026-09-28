import React, { useState } from 'react';
import { BarangayService } from '../../types/schema';
import { Search, Filter, Clock, FileCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface ServicesListProps {
  services: BarangayService[];
  onSelectService: (service: BarangayService) => void;
  onViewDetails: (service: BarangayService) => void;
}

export const ServicesList: React.FC<ServicesListProps> = ({
  services,
  onSelectService,
  onViewDetails,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(services.map(s => s.category)))];

  const filteredServices = services.filter(service => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
    return matchesSearch && matchesCategory && service.is_active;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
          Barangay Services Directory
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Explore official certifications, clearances, and community welfare services offered by Barangay Camohaguin.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search service name, clearance type, or code (e.g. BC-CLR)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        {/* Categories Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-emerald-800 text-amber-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Showing <strong>{filteredServices.length}</strong> active service(s)</span>
        <span>Standard Releasing Window: Barangay Hall Desk 1 & 2</span>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredServices.map(service => (
          <div
            key={service.id}
            className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-emerald-600 hover:shadow-md transition flex flex-col justify-between p-5"
          >
            <div>
              {/* Badge row */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded border border-emerald-200">
                  {service.code}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {service.category}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-base mb-1.5 leading-snug">
                {service.name}
              </h3>

              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                {service.description}
              </p>

              {/* Requirements Count Preview */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-4 space-y-1">
                <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>
                    {service.requirements && service.requirements.length > 0
                      ? `${service.requirements.length} Required Document(s)`
                      : 'Standard Valid ID required'}
                  </span>
                </div>
                {service.requires_residency_verification ? (
                  <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Residency Verification Required</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-slate-400" />
                    <span>Open to non-residents & local business owners</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom fee & CTAs */}
            <div className="pt-4 border-t border-slate-100 mt-2 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Barangay Fee</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {service.fee_amount === 0 ? (
                      <span className="text-emerald-700 font-bold">FREE (No Charge)</span>
                    ) : (
                      `₱${service.fee_amount.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Processing Time</span>
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {service.processing_days === 1 ? '1 Working Day' : `${service.processing_days} Working Days`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onViewDetails(service)}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-center transition"
                >
                  View Requirements
                </button>
                <button
                  type="button"
                  onClick={() => onSelectService(service)}
                  className="px-3 py-2 text-xs font-bold text-emerald-950 bg-amber-400 hover:bg-amber-300 rounded-lg text-center transition flex items-center justify-center gap-1"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
