'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  CalendarCheck,
  Clock,
  MapPin,
  Building2,
  CalendarOff,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  History,
  Info,
  Smartphone,
  Camera,
  X,
  UserCheck,
  Fingerprint,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import LivePunchCard from '@/components/attendance/LivePunchCard';
import { attendanceRepo } from '@/lib/attendance-repository';
import { AttendanceRecord } from '@/types';

export default function EmployeePortal() {
  const router = useRouter();
  const { currentUser, logout, switchRole } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [previewPhotoRecord, setPreviewPhotoRecord] = useState<AttendanceRecord | null>(null);

  // Today's live record
  const todayRecord = attendanceRepo.getEmployeeTodayRecord(currentUser.id);

  // My personal attendance history (strictly limited to maximum 6 days for employee portal policy)
  const myRecords = useMemo(() => {
    const all = attendanceRepo.getAttendanceRecords();
    const sorted = all
      .filter((r) => r.userId === currentUser.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Extract unique dates up to a maximum of 6 days
    const uniqueDates = Array.from(new Set(sorted.map((r) => r.date))).slice(0, 6);
    return sorted.filter((r) => uniqueDates.includes(r.date)).slice(0, 6);
  }, [currentUser.id, refreshKey]);

  // Statistics calculation for current employee
  const stats = useMemo(() => {
    const presentCount = myRecords.filter((r) => r.status === 'PRESENT').length;
    const lateCount = myRecords.filter((r) => r.status === 'LATE').length;
    const leaveCount = myRecords.filter((r) => r.status === 'ON_LEAVE').length;
    return {
      totalPunches: myRecords.length,
      presentCount,
      lateCount,
      leaveCount,
      remainingLeave: 12 - leaveCount,
    };
  }, [myRecords]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Hadir Tepat Waktu
          </span>
        );
      case 'LATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3 h-3" />
            Terlambat
          </span>
        );
      case 'ON_LEAVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CalendarOff className="w-3 h-3" />
            Cuti / Izin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Employee Identity Header */}
      <div className="enterprise-card rounded-2xl p-5 sm:p-6 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative">
              <img
                src={
                  currentUser.avatarUrl ||
                  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
                }
                alt={currentUser.fullName}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-blue-500/40 shadow-lg shadow-blue-500/10"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                  {currentUser.employeeCode || 'EMP-0004'}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Portal Mandiri Karyawan
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-cyan-400" />
                  {currentUser.boundDeviceId ? (
                    <span className="text-emerald-400">HP Terikat: {currentUser.boundDeviceName || 'Terdaftar'}</span>
                  ) : (
                    <span className="text-amber-400">HP Belum Terikat</span>
                  )}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                  <Fingerprint className="w-3 h-3 text-cyan-400" />
                  {currentUser.facePhotoUrl ? (
                    <span className="text-emerald-400">Wajah Terdaftar</span>
                  ) : (
                    <span className="text-amber-400">Wajah Belum Terdaftar</span>
                  )}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
                {currentUser.fullName}
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentUser.jobTitle || 'Staff Karyawan'}</span>
                <span>•</span>
                <span>{currentUser.departmentName || 'Divisi Kerja'}</span>
              </p>
            </div>
          </div>

          {/* Quick Shift Badge & Logout */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="hidden sm:block text-right">
              <div className="text-[11px] text-slate-400 font-medium">Jadwal Shift Hari Ini</div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5 justify-end mt-0.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>{currentUser.shiftName || 'Standard Office (08:00 - 17:00)'}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
              title="Keluar dari sesi portal karyawan"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* Shift Details Sub-strip for Mobile */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Cabang Penugasan: <strong className="text-white">{currentUser.branchName || 'Headquarter Sudirman'}</strong></span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Toleransi Keterlambatan: <strong className="text-slate-200">15 Menit</strong></span>
          </div>
        </div>
      </div>

      {/* Live Punch Terminal (Kios Presensi Mandiri Geofence & GPS) */}
      <div id="live-punch-terminal">
        <LivePunchCard
          onAttendanceUpdated={() => {
            setRefreshKey((k) => k + 1);
          }}
        />
      </div>

      {/* Summary KPI Cards for Employee */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="enterprise-card rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Hadir Tepat Waktu</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{stats.presentCount}</div>
            <div className="text-[10px] text-emerald-400 font-medium mt-0.5">Hari Bulan Ini</div>
          </div>
        </div>

        <div className="enterprise-card rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Terlambat</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{stats.lateCount}</div>
            <div className="text-[10px] text-amber-400 font-medium mt-0.5">Hari Bulan Ini</div>
          </div>
        </div>

        <div className="enterprise-card rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Sisa Cuti Tahunan</span>
            <CalendarOff className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{stats.remainingLeave}</div>
            <div className="text-[10px] text-cyan-400 font-medium mt-0.5">Hari Tersisa</div>
          </div>
        </div>

        <div className="enterprise-card rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Presensi</span>
            <History className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{stats.totalPunches}</div>
            <div className="text-[10px] text-blue-400 font-medium mt-0.5">Record Terverifikasi</div>
          </div>
        </div>
      </div>

      {/* Riwayat Presensi Pribadi Karyawan */}
      <div className="enterprise-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-blue-400" />
              <h2 className="text-base font-bold text-white">Riwayat Presensi Saya</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Clock className="w-3 h-3" />
                Maksimal 6 Hari Terakhir
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Catatan kehadiran terverifikasi GPS geofencing selama maksimal 6 hari kerja terakhir sesuai kebijakan portal karyawan.
            </p>
          </div>

          <Link
            href="/leaves"
            className="px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
          >
            <CalendarOff className="w-3.5 h-3.5" />
            <span>Ajukan Izin / Cuti</span>
          </Link>
        </div>

        {myRecords.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs space-y-2">
            <Calendar className="w-8 h-8 mx-auto text-slate-600 stroke-[1.5]" />
            <p>Belum ada catatan presensi untuk akun Anda.</p>
            <p className="text-[11px] text-slate-600">Gunakan kartu presensi di atas untuk melakukan Check-In.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myRecords.map((record) => (
              <div
                key={record.id}
                className="p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  {/* Photo Thumbnail if Captured */}
                  {record.photoUrl ? (
                    <button
                      type="button"
                      onClick={() => setPreviewPhotoRecord(record)}
                      className="relative w-12 h-12 rounded-xl overflow-hidden border border-cyan-500/40 bg-slate-950 shrink-0 group focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      title="Lihat foto verifikasi biometrik wajah"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={record.photoUrl}
                        alt="Face verification"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/10 flex items-center justify-center transition-colors">
                        <Camera className="w-3.5 h-3.5 text-cyan-300 drop-shadow" />
                      </div>
                    </button>
                  ) : null}

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {new Date(record.date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      {getStatusBadge(record.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Clock className="w-3 h-3" />
                        Masuk: <strong>{record.checkIn || '--:--'} WIB</strong>
                      </span>
                      <span className="flex items-center gap-1 text-slate-300">
                        <Clock3 className="w-3 h-3 text-slate-400" />
                        Pulang: <strong>{record.checkOut || '--:--'} WIB</strong>
                      </span>
                      {record.effectiveWorkHours > 0 ? (
                        <span className="text-slate-400">
                          Durasi: {record.effectiveWorkHours.toFixed(1)} Jam
                        </span>
                      ) : null}
                    </div>

                    {record.notes && (
                      <p className="text-[11px] text-slate-500 italic mt-0.5">
                        Catatan: {record.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  {record.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewPhotoRecord(record)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 transition-colors"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Foto Bukti</span>
                    </button>
                  )}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium border ${
                    record.verificationMethod === 'FACIAL_RECOG'
                      ? 'bg-cyan-950/30 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700/60'
                  }`}>
                    <ShieldCheck className="w-3 h-3 text-cyan-400" />
                    {record.verificationMethod === 'FACIAL_RECOG' ? 'Face Biometric' : record.verificationMethod}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Face Photo Modal Preview */}
      {previewPhotoRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Bukti Presensi Biometrik</h4>
                  <p className="text-[11px] text-slate-400">{previewPhotoRecord.date}</p>
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
                alt="Face Snapshot"
                className="w-full max-h-72 object-contain"
              />
            </div>

            <div className="space-y-1.5 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-slate-400">
                <span>Pegawai:</span>
                <span className="font-semibold text-white">{currentUser.fullName}</span>
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
                <div className="pt-1 border-t border-slate-800/80 text-[11px] text-slate-400 italic">
                  {previewPhotoRecord.notes}
                </div>
              )}
            </div>

            <button
              onClick={() => setPreviewPhotoRecord(null)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

