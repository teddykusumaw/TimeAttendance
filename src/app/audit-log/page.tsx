'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Lock,
  User,
  Clock,
  Terminal,
  FileSpreadsheet,
  Calendar,
  RefreshCw,
  Database,
} from 'lucide-react';
import { attendanceRepo } from '@/lib/attendance-repository';
import RoleGuard from '@/components/auth/RoleGuard';
import { AuditLog } from '@/types';

export default function AuditLogPage() {
  const [filterAction, setFilterAction] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<AuditLog[]>(attendanceRepo.getAuditLogs());
  const [loading, setLoading] = useState(false);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.status === 'success' && Array.isArray(json.data)) {
        setLogs(json.data);
      }
    } catch (e) {
      console.warn('Error fetching audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<AuditLog[]>;
      if (customEvent.detail) setLogs(customEvent.detail);
      else fetchAuditLogs();
    };

    window.addEventListener('audit_logs_updated', handleUpdate);
    return () => window.removeEventListener('audit_logs_updated', handleUpdate);
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        log.actorName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        (log.details && log.details.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN', 'HR_ADMIN']}>
      <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Kepatuhan & Keamanan Enterprise</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Audit Trail & Log Kepatuhan (Tier 1)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Catatan mutasi tak terhapuskan (immutable) yang tersimpan langsung di Neon PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>Neon DB ({filteredLogs.length} Log)</span>
          </div>
          <button
            type="button"
            onClick={fetchAuditLogs}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Menyinkronkan...' : 'Segarkan'}</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="enterprise-card rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari aktor, aksi, atau rincian audit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-purple-500 text-white placeholder-slate-500 outline-none"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-purple-500 text-white outline-none appearance-none cursor-pointer"
            >
              <option value="ALL">Semua Jenis Aksi Audit ({logs.length})</option>
              <option value="LOGIN">Autentikasi Masuk (LOGIN)</option>
              <option value="SYSTEM_INIT">Inisialisasi Sistem (SYSTEM_INIT)</option>
              <option value="PUNCH_IN">Presensi Masuk (PUNCH_IN)</option>
              <option value="PUNCH_OUT">Presensi Pulang (PUNCH_OUT)</option>
              <option value="DEVICE_BIND">Pengikatan HP (DEVICE_BIND)</option>
              <option value="DEVICE_UNBIND">Reset Pengikatan HP (DEVICE_UNBIND)</option>
              <option value="ENROLL_FACE">Pendaftaran Biometrik Wajah (ENROLL_FACE)</option>
              <option value="BULK_EXCEL_IMPORT">Impor Massal Excel (BULK_EXCEL_IMPORT)</option>
              <option value="LEAVE_APPROVE">Persetujuan Cuti (LEAVE_APPROVE)</option>
              <option value="SHIFT_POLICY_UPDATE">Perubahan Kebijakan Shift</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5 font-semibold">Waktu (Timestamp)</th>
                <th className="p-3.5 font-semibold">Aktor / Pengguna</th>
                <th className="p-3.5 font-semibold">Aksi Enterprise</th>
                <th className="p-3.5 font-semibold">Rincian Perubahan (Details)</th>
                <th className="p-3.5 font-semibold">Alamat IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/30">
                  <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('id-ID')}
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-white">{log.actorName}</div>
                    <div className="text-[10px] font-mono text-purple-400">{log.actorRole}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-300 max-w-md">{log.details}</td>
                  <td className="p-3.5 font-mono text-slate-400 text-[11px]">{log.ipAddress || '10.240.1.1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}
