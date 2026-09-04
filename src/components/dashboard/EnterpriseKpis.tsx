'use client';

import React, { useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CalendarOff,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { attendanceRepo } from '@/lib/attendance-repository';

interface EnterpriseKpisProps {
  refreshTrigger?: number;
}

export default function EnterpriseKpis({ refreshTrigger }: EnterpriseKpisProps) {
  const metrics = useMemo(() => {
    return attendanceRepo.getDashboardMetrics();
  }, [refreshTrigger]);

  const cards = [
    {
      title: 'Tingkat Kehadiran',
      value: `${metrics.attendanceRate}%`,
      subtitle: `${metrics.presentToday + metrics.lateToday} dari ${metrics.totalEmployees} karyawan`,
      icon: Percent,
      gradient: 'from-blue-600/20 to-indigo-600/10',
      border: 'border-blue-500/30',
      iconColor: 'text-blue-400',
      progress: metrics.attendanceRate,
    },
    {
      title: 'Hadir Tepat Waktu',
      value: metrics.presentToday,
      subtitle: 'Presensi sesuai jam kerja shift',
      icon: CheckCircle2,
      gradient: 'from-emerald-600/20 to-teal-600/10',
      border: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      tag: 'On Time',
    },
    {
      title: 'Keterlambatan',
      value: metrics.lateToday,
      subtitle: `Rata-rata ${metrics.averageLateMinutes} mnt melewati batas toleransi`,
      icon: AlertTriangle,
      gradient: 'from-amber-600/20 to-orange-600/10',
      border: 'border-amber-500/30',
      iconColor: 'text-amber-400',
      alert: metrics.lateToday > 0,
    },
    {
      title: 'Total Jam Lembur',
      value: `${metrics.totalOvertimeHours}h`,
      subtitle: 'Akumulasi jam kerja lembur bulan ini',
      icon: Clock,
      gradient: 'from-purple-600/20 to-indigo-600/10',
      border: 'border-purple-500/30',
      iconColor: 'text-purple-400',
    },
    {
      title: 'Cuti & Izin Aktif',
      value: metrics.onLeaveToday,
      subtitle: `${metrics.absentToday} Alpa / Tanpa Keterangan`,
      icon: CalendarOff,
      gradient: 'from-rose-600/20 to-pink-600/10',
      border: 'border-rose-500/30',
      iconColor: 'text-rose-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`enterprise-card rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between ${card.border}`}
          >
            {/* Top row */}
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold text-slate-400">{card.title}</span>
              <div className={`p-2 rounded-xl bg-slate-900/90 border border-slate-800 ${card.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Middle row: Big Metric */}
            <div className="my-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
                {card.value}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">{card.subtitle}</p>
            </div>

            {/* Optional Progress Bar for Attendance Rate */}
            {card.progress !== undefined && (
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, card.progress))}%` }}
                ></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
