'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Upload,
  Calendar,
  Building2,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Edit3,
  Camera,
  X,
  UserCheck,
} from 'lucide-react';
import { AttendanceRecord, AttendanceFilters } from '@/types';
import { attendanceRepo } from '@/lib/attendance-repository';
import { exportAttendanceToExcel, downloadExcelBlob } from '@/lib/excel-utils';
import { useAuth } from '@/context/AuthContext';

interface AttendanceLedgerTableProps {
  onOpenBulkUpload?: () => void;
  onRefresh?: () => void;
}

export default function AttendanceLedgerTable({
  onOpenBulkUpload,
  onRefresh,
}: AttendanceLedgerTableProps) {
  const { currentUser, permissions } = useAuth();
  const [previewPhotoRecord, setPreviewPhotoRecord] = useState<AttendanceRecord | null>(null);

  const [filters, setFilters] = useState<AttendanceFilters>({
    searchQuery: '',
    departmentId: 'ALL',
    branchId: 'ALL',
    status: 'ALL',
    dateFrom: '',
    dateTo: '',
    shiftId: 'ALL',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;

  const branches = attendanceRepo.getBranches();
  const departments = attendanceRepo.getDepartments();

  // Load and filter records based on RBAC and user filters
  const filteredRecords = useMemo(() => {
    let records = attendanceRepo.getAttendanceRecords(filters);
    if (currentUser.role === 'EMPLOYEE') {
      records = records.filter((r) => r.userId === currentUser.id);
    } else if (currentUser.role === 'MANAGER') {
      records = records.filter((r) => r.departmentName === currentUser.departmentName);
    }
    return records;
  }, [filters, currentUser]);

  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRecords.slice(start, start + rowsPerPage);
  }, [filteredRecords, currentPage]);


  const handleExportExcel = () => {
    const buffer = exportAttendanceToExcel(filteredRecords);
    downloadExcelBlob(buffer, `Rekap_Presensi_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };


  const getStatusBadge = (record: AttendanceRecord) => {
    switch (record.status) {
      case 'PRESENT':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Hadir Tepat
          </span>
        );
      case 'LATE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Terlambat ({record.lateMinutes}m)
          </span>
        );
      case 'OVERTIME':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Lembur ({record.overtimeMinutes}m)
          </span>
        );
      case 'EARLY_DEPARTURE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 inline-flex items-center gap-1.5">
            Pulang Cepat ({record.earlyMinutes}m)
          </span>
        );
      case 'ON_LEAVE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 inline-flex items-center gap-1.5">
            Cuti / Izin
          </span>
        );
      case 'ABSENT':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 inline-flex items-center gap-1.5">
            Alpa (Tidak Hadir)
          </span>
        );
    }
  };

  const isEmployee = currentUser.role === 'EMPLOYEE';
  const isManager = currentUser.role === 'MANAGER';

  const tableTitle = isEmployee
    ? 'Riwayat Presensi Pribadi'
    : isManager
    ? `Ledger Presensi Tim (${currentUser.departmentName})`
    : 'Ledger Presensi Enterprise';

  const tableSubtitle = isEmployee
    ? 'Catatan kehadiran pribadi Anda dengan status presensi dan jam kerja terverifikasi.'
    : isManager
    ? `Monitoring presensi real-time bawahan pada divisi ${currentUser.departmentName}.`
    : 'Catatan presensi real-time terverifikasi dengan riwayat audit & metode check-in.';

  return (
    <div className="enterprise-card rounded-2xl p-5 sm:p-6 space-y-5">
      {/* Table Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>{tableTitle}</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {filteredRecords.length} Data
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {tableSubtitle}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {permissions.canUploadBulkExcel && onOpenBulkUpload && (
            <button
              onClick={onOpenBulkUpload}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah Bulk Excel</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all"
            title="Ekspor data hasil filter ke format Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={`grid grid-cols-1 gap-3 ${isEmployee ? 'sm:grid-cols-2 lg:grid-cols-2' : isManager ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isEmployee ? 'Cari tanggal atau keterangan...' : 'Cari NIK, Nama, atau Divisi...'}
            value={filters.searchQuery}
            onChange={(e) => {
              setFilters({ ...filters, searchQuery: e.target.value });
              setCurrentPage(1);
            }}
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500 outline-none transition-all"
          />
        </div>

        {/* Branch Filter (Hidden for Employee) */}
        {!isEmployee && (
          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filters.branchId}
              onChange={(e) => {
                setFilters({ ...filters, branchId: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-blue-500 text-white outline-none appearance-none cursor-pointer"
            >
              <option value="ALL">Semua Cabang (All Branches)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Department Filter (Only for HR Admin & Super Admin) */}
        {!isEmployee && !isManager && (
          <div className="relative">
            <Users className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filters.departmentId}
              onChange={(e) => {
                setFilters({ ...filters, departmentId: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-blue-500 text-white outline-none appearance-none cursor-pointer"
            >
              <option value="ALL">Semua Departemen</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}


        {/* Status Filter */}
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setCurrentPage(1);
            }}
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-blue-500 text-white outline-none appearance-none cursor-pointer"
          >
            <option value="ALL">Semua Status Presensi</option>
            <option value="PRESENT">Hadir Tepat Waktu</option>
            <option value="LATE">Terlambat</option>
            <option value="OVERTIME">Lembur (Overtime)</option>
            <option value="EARLY_DEPARTURE">Pulang Lebih Awal</option>
            <option value="ON_LEAVE">Sedang Cuti / Izin</option>
            <option value="ABSENT">Alpa</option>
          </select>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="rounded-xl border border-slate-800 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 select-none">
            <tr>
              <th className="p-3.5 font-semibold">Karyawan / NIK</th>
              <th className="p-3.5 font-semibold">Departemen & Cabang</th>
              <th className="p-3.5 font-semibold">Tanggal</th>
              <th className="p-3.5 font-semibold">Jam Masuk</th>
              <th className="p-3.5 font-semibold">Jam Pulang</th>
              <th className="p-3.5 font-semibold">Durasi Kerja</th>
              <th className="p-3.5 font-semibold">Status</th>
              <th className="p-3.5 font-semibold">Metode</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  Tidak ada data presensi yang sesuai dengan kriteria filter.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((r) => {
                const inTime = r.checkIn ? r.checkIn.split('T')[1]?.slice(0, 5) || r.checkIn : '-';
                const outTime = r.checkOut ? r.checkOut.split('T')[1]?.slice(0, 5) || r.checkOut : '-';

                return (
                  <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5">
                      <div className="font-semibold text-white">{r.employeeName}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">{r.employeeCode}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-300 font-medium">{r.departmentName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{r.branchName}</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-300 whitespace-nowrap">{r.date}</td>
                    <td className="p-3.5 font-mono font-medium text-white">{inTime}</td>
                    <td className="p-3.5 font-mono font-medium text-white">{outTime}</td>
                    <td className="p-3.5 font-mono text-slate-300">
                      {r.effectiveWorkHours > 0 ? `${r.effectiveWorkHours} Jam` : '-'}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">{getStatusBadge(r)}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        {r.photoUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewPhotoRecord(r)}
                            className="relative w-7 h-7 rounded-lg overflow-hidden border border-cyan-500/40 bg-slate-900 group hover:border-cyan-400 shrink-0 transition-transform active:scale-95"
                            title="Klik untuk melihat foto presensi wajah"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={r.photoUrl}
                              alt="Biometric Face"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera className="w-3 h-3 text-white drop-shadow" />
                            </div>
                          </button>
                        )}
                        <span
                          className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                            r.verificationMethod === 'FACIAL_RECOG'
                              ? 'bg-cyan-950/40 text-cyan-300 border-cyan-500/40 font-semibold'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {r.verificationMethod}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-400">
        <div>
          Menampilkan baris{' '}
          <strong className="text-slate-200">
            {filteredRecords.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
          </strong>{' '}
          sampai{' '}
          <strong className="text-slate-200">
            {Math.min(currentPage * rowsPerPage, filteredRecords.length)}
          </strong>{' '}
          dari <strong className="text-slate-200">{filteredRecords.length}</strong> catatan
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 font-mono text-white">
            Halaman {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Admin Biometric Face Photo Audit Modal */}
      {previewPhotoRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Verifikasi Wajah Biometrik</h4>
                  <p className="text-[11px] font-mono text-slate-400">{previewPhotoRecord.date}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewPhotoRecord(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPhotoRecord.photoUrl || ''}
                alt="Face Audit Snapshot"
                className="w-full max-h-72 object-contain"
              />
            </div>

            <div className="space-y-1.5 text-xs bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-slate-400">
                <span>Nama Karyawan:</span>
                <span className="font-semibold text-white">{previewPhotoRecord.employeeName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>NIK:</span>
                <span className="font-mono text-slate-300">{previewPhotoRecord.employeeCode}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Divisi / Cabang:</span>
                <span className="text-slate-300">{previewPhotoRecord.departmentName} • {previewPhotoRecord.branchName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Jam Masuk:</span>
                <span className="font-mono text-emerald-400 font-bold">{previewPhotoRecord.checkIn || '-'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Metode:</span>
                <span className="font-mono text-cyan-300 font-semibold">{previewPhotoRecord.verificationMethod}</span>
              </div>
              {previewPhotoRecord.notes && (
                <div className="pt-1.5 border-t border-slate-800/80 text-[11px] text-slate-400 italic">
                  {previewPhotoRecord.notes}
                </div>
              )}
            </div>

            <button
              onClick={() => setPreviewPhotoRecord(null)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Tutup Audit Wajah
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
