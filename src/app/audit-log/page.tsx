'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { attendanceRepo } from '@/lib/attendance-repository';
import RoleGuard from '@/components/auth/RoleGuard';

export default function AuditLogPage() {
  const [filterAction, setFilterAction] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const logs = attendanceRepo.getAuditLogs();

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
            Catatan mutasi tak terhapuskan (immutable) untuk setiap aksi presensi, approval, dan impor Excel.
          </p>
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
              <option value="ALL">Semua Jenis Aksi Audit</option>
              <option value="PUNCH_IN">Presensi Masuk (PUNCH_IN)</option>
              <option value="PUNCH_OUT">Presensi Pulang (PUNCH_OUT)</option>
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
