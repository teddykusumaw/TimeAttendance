'use client';

import React, { useState } from 'react';
import {
  Clock,
  Plus,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Building2,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import { attendanceRepo } from '@/lib/attendance-repository';
import { Shift } from '@/types';
import { useAuth } from '@/context/AuthContext';
import RoleGuard from '@/components/auth/RoleGuard';

export default function ShiftsPage() {
  const { permissions } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>(attendanceRepo.getShifts());
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

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
      </div>

      {/* Shifts Cards Grid */}
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

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400">
                  <Clock className="w-5 h-5" />
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
              <span className="text-slate-500 text-[11px]">Berlaku untuk seluruh cabang terhubung</span>
            </div>
          </div>
        ))}
      </div>
    </div>
    </RoleGuard>
  );
}
