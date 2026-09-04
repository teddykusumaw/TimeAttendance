'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Building2,
  Sliders,
  Trash2,
  X,
  Save,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { attendanceRepo } from '@/lib/attendance-repository';
import { Shift } from '@/types';
import { useAuth } from '@/context/AuthContext';
import RoleGuard from '@/components/auth/RoleGuard';

export default function ShiftsPage() {
  const { permissions } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>(attendanceRepo.getShifts());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states for new shift
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [gracePeriodMins, setGracePeriodMins] = useState(15);
  const [breakMins, setBreakMins] = useState(60);
  const [workDays, setWorkDays] = useState('MON,TUE,WED,THU,FRI');
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const handleShiftsUpdated = (e: any) => {
      if (e.detail) setShifts(e.detail);
      else setShifts(attendanceRepo.getShifts());
    };
    window.addEventListener('shifts_updated', handleShiftsUpdated);
    return () => window.removeEventListener('shifts_updated', handleShiftsUpdated);
  }, []);

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await attendanceRepo.createShift({
        name: name.trim(),
        code: code.trim() || `SH-${startTime.replace(':', '')}`,
        startTime,
        endTime,
        gracePeriodMins: Number(gracePeriodMins) || 15,
        breakMins: Number(breakMins) || 60,
        isFlexible: false,
        workDays,
      });

      setShifts(attendanceRepo.getShifts());
      setMsg({ type: 'success', text: `Shift "${name}" berhasil dibuat di database Neon.` });
      setIsAddModalOpen(false);
      setName('');
      setCode('');
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Gagal membuat shift.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteShift = async (id: string, shiftName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus shift "${shiftName}"?`)) return;
    await attendanceRepo.deleteShift(id);
    setShifts(attendanceRepo.getShifts());
    setMsg({ type: 'success', text: `Shift "${shiftName}" berhasil dihapus.` });
    setTimeout(() => setMsg(null), 4000);
  };

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN', 'HR_ADMIN']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
              <Clock className="w-4 h-4" />
              <span>Master Shift & Roster</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Pengaturan Shift & Kebijakan Presensi
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Konfigurasi jam kerja, batas toleransi keterlambatan (grace period), dan jam istirahat perusahaan.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-98 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Shift Baru</span>
          </button>
        </div>

        {msg && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
              msg.type === 'success'
                ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
            }`}
          >
            {msg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Empty State */}
        {shifts.length === 0 ? (
          <div className="enterprise-card rounded-2xl p-12 text-center space-y-4 border-dashed border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
              <Clock className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-white">Belum Ada Shift Terdaftar</h3>
              <p className="text-xs text-slate-400 mt-1">
                Data demo telah dibersihkan. Anda dapat membuat jadwal shift jam kerja perusahaan secara manual sesuai kebutuhan operasional.
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Shift Pertama</span>
            </button>
          </div>
        ) : (
          /* Shifts Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {shifts.map((shift) => (
              <div
                key={shift.id}
                className="enterprise-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {shift.code}
                      </span>
                      <h3 className="text-base font-bold text-white mt-2">{shift.name}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteShift(shift.id, shift.name)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 border border-slate-800 transition-colors"
                        title="Hapus Shift"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400">
                        <Clock className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Timing Schedule */}
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium">Jam Masuk</span>
                      <p className="text-xl font-mono font-extrabold text-white mt-0.5">{shift.startTime}</p>
                    </div>
                    <div className="text-slate-600 font-mono text-lg">→</div>
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium">Jam Pulang</span>
                      <p className="text-xl font-mono font-extrabold text-white mt-0.5">{shift.endTime}</p>
                    </div>
                    <div className="h-8 w-px bg-slate-800"></div>
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium">Istirahat</span>
                      <p className="text-sm font-mono font-bold text-slate-300 mt-1">{shift.breakMins} Menit</p>
                    </div>
                  </div>

                  {/* Policy Parameters */}
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
                      <span className="text-slate-500">Toleransi Keterlambatan:</span>
                      <p className="font-semibold text-amber-400 mt-0.5">
                        {shift.gracePeriodMins} Menit (Grace Period)
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
                      <span className="text-slate-500">Hari Kerja Aktif:</span>
                      <p className="font-semibold text-slate-200 mt-0.5 truncate">{shift.workDays}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Shift Aktif
                  </span>
                  <span className="text-slate-500 text-[11px]">Tersimpan di Neon PostgreSQL</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Shift Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-lg enterprise-card rounded-2xl p-6 sm:p-7 overflow-hidden border-slate-700 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Tambah Shift Kerja Baru</h3>
                    <p className="text-xs text-slate-400">Konfigurasi jadwal jam kerja di Neon PostgreSQL</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateShift} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nama Shift <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Standard Office (08:00 - 17:00)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Kode Shift
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="STD-0817"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Toleransi (Menit)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={gracePeriodMins}
                      onChange={(e) => setGracePeriodMins(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Jam Masuk
                    </label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Jam Pulang
                    </label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Istirahat (Mnt)
                    </label>
                    <input
                      type="number"
                      value={breakMins}
                      onChange={(e) => setBreakMins(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Hari Kerja Aktif
                  </label>
                  <input
                    type="text"
                    value={workDays}
                    onChange={(e) => setWorkDays(e.target.value)}
                    placeholder="MON,TUE,WED,THU,FRI"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Simpan Shift</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
