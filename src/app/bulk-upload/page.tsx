'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  History,
  Info,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { attendanceRepo } from '@/lib/attendance-repository';
import { generateAttendanceTemplate, downloadExcelBlob } from '@/lib/excel-utils';
import BulkUploadModal from '@/components/attendance/BulkUploadModal';
import { useAuth } from '@/context/AuthContext';
import RoleGuard from '@/components/auth/RoleGuard';

export default function BulkUploadPage() {
  const { currentUser, permissions } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const batches = attendanceRepo.getBatches();

  const handleDownloadTemplate = () => {
    const users = attendanceRepo.getUsers();
    const shifts = attendanceRepo.getShifts();
    const branches = attendanceRepo.getBranches();
    const buffer = generateAttendanceTemplate(users, shifts, branches);
    downloadExcelBlob(buffer, 'Template_Presensi_Enterprise_Tier1.xlsx');
  };

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN', 'HR_ADMIN']}>
      <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Enterprise Data Integration</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Pusat Unggah Massal Excel (Bulk Upload Hub)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Fasilitas integrasi data presensi berskala besar (ribuan baris) dengan validasi otomatis dan toleransi shift.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Template (.xlsx)</span>
          </button>

          {permissions.canUploadBulkExcel && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-98"
            >
              <Upload className="w-4 h-4" />
              <span>Unggah File Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview & Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="enterprise-card rounded-2xl p-5 border-blue-500/20">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
            <Download className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">1. Unduh Template Standar</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Template Excel dilengkapi format kolom baku, sample data nyata, dan tab kamus NIK karyawan aktif.
          </p>
        </div>

        <div className="enterprise-card rounded-2xl p-5 border-indigo-500/20">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
            <FileCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">2. Multi-Pass Validator</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Pemeriksaan otomatis format tanggal, waktu 24 jam, keabsahan NIK, dan deteksi anomali jam pulang.
          </p>
        </div>

        <div className="enterprise-card rounded-2xl p-5 border-emerald-500/20">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">3. Batch Commit & Audit</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Penyimpanan aman ke database dengan pencatatan audit log lengkap (pengunggah, jumlah sukses, error summary).
          </p>
        </div>
      </div>

      {/* Historical Batch Import Records */}
      <div className="enterprise-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-blue-400">
              <History className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Riwayat Batch Impor Excel</h3>
              <p className="text-xs text-slate-400">Histori batch yang telah diproses oleh HR Admin & Super Admin</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5 font-semibold">Nama File</th>
                <th className="p-3.5 font-semibold">Ukuran</th>
                <th className="p-3.5 font-semibold">Waktu Unggah</th>
                <th className="p-3.5 font-semibold">Pengunggah</th>
                <th className="p-3.5 font-semibold">Total Baris</th>
                <th className="p-3.5 font-semibold">Sukses</th>
                <th className="p-3.5 font-semibold">Gagal</th>
                <th className="p-3.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-900/30">
                  <td className="p-3.5 font-medium text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{b.fileName}</span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-400">{(b.fileSize / 1024).toFixed(1)} KB</td>
                  <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap">
                    {new Date(b.createdAt).toLocaleString('id-ID')}
                  </td>
                  <td className="p-3.5 text-slate-300">
                    <div className="font-medium">{b.uploadedByName}</div>
                    <div className="text-[10px] text-slate-500">{b.uploadedByRole}</div>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-white">{b.totalRows}</td>
                  <td className="p-3.5 font-mono text-emerald-400 font-semibold">{b.successCount}</td>
                  <td className="p-3.5 font-mono text-rose-400 font-semibold">{b.errorCount}</td>
                  <td className="p-3.5">
                    {b.errorCount === 0 ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Sukses 100%
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Sebagian Sukses
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <BulkUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
    </RoleGuard>
  );
}
