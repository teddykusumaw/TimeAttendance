'use client';

import React, { useState, useMemo } from 'react';
import {
  CalendarOff,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { attendanceRepo } from '@/lib/attendance-repository';
import { LeaveRequest } from '@/types';

export default function LeavesPage() {
  const { currentUser, permissions } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>(attendanceRepo.getLeaveRequests());
  const [showForm, setShowForm] = useState(false);

  // Filter requests based on active user role
  const filteredRequests = useMemo(() => {
    if (currentUser.role === 'EMPLOYEE') {
      return requests.filter((r) => r.userId === currentUser.id);
    }
    if (currentUser.role === 'MANAGER') {
      return requests.filter((r) => r.departmentName === currentUser.departmentName);
    }
    return requests;
  }, [requests, currentUser]);

  // Form states
  const [leaveType, setLeaveType] = useState<'ANNUAL' | 'SICK' | 'SPECIAL' | 'MATERNITY'>('ANNUAL');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');


  const refreshRequests = () => {
    setRequests(attendanceRepo.getLeaveRequests());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    attendanceRepo.submitLeaveRequest({
      userId: currentUser.id,
      employeeCode: currentUser.employeeCode,
      employeeName: currentUser.fullName,
      departmentName: currentUser.departmentName || 'Engineering',
      leaveType,
      startDate,
      endDate,
      totalDays: 1,
      reason,
    });

    setReason('');
    setShowForm(false);
    refreshRequests();
  };

  const handleAction = (id: string, action: 'APPROVE' | 'REJECT') => {
    attendanceRepo.reviewLeaveRequest(
      id,
      action,
      currentUser,
      action === 'APPROVE' ? 'Disetujui oleh atasan berwenang' : 'Ditolak: kapasitas tim tidak mencukupi'
    );
    refreshRequests();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1">
            <CalendarOff className="w-4 h-4" />
            <span>Alur Persetujuan Enterprise</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Manajemen Cuti & Izin Kerja
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sistem pengajuan izin, cuti tahunan, dan persetujuan multi-level (Manager & HR).
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Ajukan Cuti / Izin</span>
        </button>
      </div>

      {/* Submission Form Modal / Card */}
      {showForm && (
        <form onSubmit={handleSubmit} className="enterprise-card rounded-2xl p-6 space-y-4 border-blue-500/30">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Form Pengajuan Permohonan Cuti Baru</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Jenis Izin / Cuti</label>
              <select
                value={leaveType}
                onChange={(e: any) => setLeaveType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-blue-500"
              >
                <option value="ANNUAL">Cuti Tahunan (Annual Leave)</option>
                <option value="SICK">Izin Sakit dengan Surat Dokter</option>
                <option value="SPECIAL">Cuti Khusus (Menikah/Duka)</option>
                <option value="MATERNITY">Cuti Melahirkan</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Tanggal Mulai</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Tanggal Berakhir</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-medium mb-1">Alasan Pengajuan</label>
            <textarea
              rows={3}
              placeholder="Jelaskan kebutuhan izin atau urusan cuti secara jelas..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full text-xs p-3 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-blue-500 placeholder-slate-500"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md"
            >
              Kirim Pengajuan
            </button>
          </div>
        </form>
      )}

      {/* Requests Ledger */}
      <div className="enterprise-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">
              {currentUser.role === 'EMPLOYEE'
                ? 'Histori Pengajuan Cuti Saya'
                : currentUser.role === 'MANAGER'
                ? `Persetujuan Cuti Tim Divisi (${currentUser.departmentName})`
                : 'Daftar Pengajuan Cuti & Izin Perusahaan'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentUser.role === 'EMPLOYEE'
                ? 'Pantau status permohonan izin Anda yang diajukan ke atasan.'
                : 'Tinjau dan setujui permohonan cuti bawahan sesuai wewenang Anda.'}
            </p>
          </div>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {filteredRequests.length} Permohonan
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5 font-semibold">Pemohon</th>
                <th className="p-3.5 font-semibold">Jenis Cuti</th>
                <th className="p-3.5 font-semibold">Rentang Waktu</th>
                <th className="p-3.5 font-semibold">Alasan</th>
                <th className="p-3.5 font-semibold">Status Persetujuan</th>
                <th className="p-3.5 font-semibold">Reviewer</th>
                {permissions.canApproveLeave && <th className="p-3.5 font-semibold text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={permissions.canApproveLeave ? 7 : 6} className="p-8 text-center text-slate-500">
                    Tidak ada data permohonan cuti.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (

                <tr key={req.id} className="hover:bg-slate-900/30">
                  <td className="p-3.5">
                    <div className="font-semibold text-white">{req.employeeName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{req.employeeCode}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-slate-300 border border-slate-800">
                      {req.leaveType}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-300">
                    {req.startDate} → {req.endDate} ({req.totalDays} Hari)
                  </td>
                  <td className="p-3.5 text-slate-300 max-w-xs">{req.reason}</td>
                  <td className="p-3.5">
                    {req.status === 'HR_APPROVED' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Disetujui HR
                      </span>
                    ) : req.status === 'MANAGER_APPROVED' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Disetujui Manager
                      </span>
                    ) : req.status === 'REJECTED' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Ditolak
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Menunggu Review
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-400 text-[11px]">{req.approvedBy || '-'}</td>
                  {permissions.canApproveLeave && (
                    <td className="p-3.5 text-right space-x-2">
                      {req.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleAction(req.id, 'APPROVE')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition-colors"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => handleAction(req.id, 'REJECT')}
                            className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[11px] font-semibold transition-colors"
                          >
                            Tolak
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              )))
            }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
