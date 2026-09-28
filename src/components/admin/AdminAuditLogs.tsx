import React, { useState, useEffect } from 'react';
import { BarangayDatabase } from '../../services/db';
import { AdminUser, AuditLog } from '../../types/schema';
import { checkSupabaseConnection, SupabaseHealth } from '../../lib/supabase';
import { History, Shield, RefreshCw, Search, User, Filter, AlertCircle, Database, CheckCircle2, Copy, Check } from 'lucide-react';

interface AdminAuditLogsProps {
  auditLogs: AuditLog[];
  activeAdmin: AdminUser;
  onRefresh: () => void;
}

export const AdminAuditLogs: React.FC<AdminAuditLogsProps> = ({
  auditLogs,
  activeAdmin,
  onRefresh,
}) => {
  const [filterAction, setFilterAction] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [resetMessage, setResetMessage] = useState(false);
  const [supabaseHealth, setSupabaseHealth] = useState<SupabaseHealth | null>(null);
  const [checkingSupabase, setCheckingSupabase] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const runSupabaseCheck = async () => {
    setCheckingSupabase(true);
    const health = await checkSupabaseConnection();
    setSupabaseHealth(health);
    setCheckingSupabase(false);
  };

  useEffect(() => {
    runSupabaseCheck();
  }, []);

  const handleResetData = () => {
    if (window.confirm('Reset all demo data back to clean initial database seed? Any changes made will be restored.')) {
      BarangayDatabase.resetToDefaultData();
      onRefresh();
      setResetMessage(true);
      setTimeout(() => setResetMessage(false), 3000);
    }
  };

  const filtered = auditLogs.filter(log => {
    const matchesAction = filterAction === 'All' || log.action === filterAction;
    const matchesSearch =
      log.actor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const actions = ['All', ...Array.from(new Set(auditLogs.map(l => l.action)))];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
            System Audit Trail & Governance Log
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Immutable log of staff actions, residency verifications, request status transitions, and service modifications.
          </p>
        </div>

        <button
          onClick={handleResetData}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto border border-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Demo Data to Seed</span>
        </button>
      </div>

      {resetMessage && (
        <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl text-xs text-emerald-900">
          Database successfully refreshed with standard Barangay Camohaguin initial seed data!
        </div>
      )}

      {/* Supabase Integration Diagnostic Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Supabase Database Integration</h3>
                {supabaseHealth?.connected ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Keys Active & Responding
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Checking...
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate max-w-md">
                {supabaseHealth?.url || 'https://cbcvhmvdaujhbquryaom.supabase.co'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runSupabaseCheck}
              disabled={checkingSupabase}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${checkingSupabase ? 'animate-spin' : ''}`} />
              <span>{checkingSupabase ? 'Pinging...' : 'Ping Supabase'}</span>
            </button>
          </div>
        </div>

        {supabaseHealth && (
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-600">
                <strong>Publishable Key:</strong> <code className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-[11px] text-emerald-800">{supabaseHealth.keyPreview}</code>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {supabaseHealth.message}
              </span>
            </div>
            {supabaseHealth.exposedSchemasNotice && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 space-y-1">
                <span className="font-bold block">💡 Supabase Schema Configuration Note:</span>
                <p>
                  Your Supabase REST endpoint currently exposes the <code>public</code> schema. 
                  To query custom schemas like <code>barangay</code> directly via PostgREST, enable it under 
                  <strong> Supabase Dashboard → Settings → API → Data API Settings → Exposed Schemas</strong>, 
                  or deploy the migration tables directly into the <code>public</code> schema using the SQL Editor in <code>supabase/migrations/</code>.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by actor, action type, entity ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-semibold text-slate-700"
        >
          {actions.map(act => (
            <option key={act} value={act}>
              {act}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('en-PH')}
                  </td>
                  <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                    {log.actor_name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-slate-100 text-emerald-900 px-2 py-0.5 rounded text-[11px] font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-700">
                    <span className="text-[11px] text-slate-400 block font-normal font-sans">
                      {log.entity_type}
                    </span>
                    {log.entity_id}
                  </td>
                  <td className="py-3 px-4 text-[11px] text-slate-600 max-w-xs truncate font-sans">
                    {log.details ? JSON.stringify(log.details) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
