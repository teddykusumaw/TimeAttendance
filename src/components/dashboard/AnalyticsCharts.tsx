'use client';

import React from 'react';
import {
  TrendingUp,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

export default function AnalyticsCharts() {
  const weeklyData = [
    { day: 'Sen', present: 96, late: 4, label: '96% Hadir' },
    { day: 'Sel', present: 92, late: 8, label: '92% Hadir' },
    { day: 'Rab', present: 98, late: 2, label: '98% Hadir' },
    { day: 'Kam', present: 88, late: 12, label: '88% Hadir' },
    { day: 'Jum (Hari ini)', present: 94, late: 6, label: '94% Hadir' },
  ];

  const departmentPerformance = [
    { name: 'Software Engineering & IT', rate: 98, count: '5 Karyawan', status: 'Optimal' },
    { name: 'Product & Design', rate: 95, count: '3 Karyawan', status: 'Baik' },
    { name: 'Human Resource & People Ops', rate: 100, count: '2 Karyawan', status: 'Sempurna' },
    { name: 'Finance & Accounting', rate: 90, count: '2 Karyawan', status: 'Normal' },
    { name: 'Operations & Logistics', rate: 86, count: '4 Karyawan', status: 'Perlu Perhatian' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 2-Column: Weekly Attendance & Punctuality Trend */}
      <div className="lg:col-span-2 enterprise-card rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <BarChart3 className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">Tren Kehadiran Mingguan</h4>
                <p className="text-xs text-slate-400">Rasio ketepatan waktu vs keterlambatan hari kerja berjalan</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded bg-blue-500"></span>
                Tepat Waktu
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
                Terlambat
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="mt-6 grid grid-cols-5 gap-4 items-end h-44 pt-4 border-b border-slate-800">
            {weeklyData.map((item, i) => (
              <div key={i} className="flex flex-col items-center h-full justify-end group cursor-pointer">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white mb-2 whitespace-nowrap shadow-xl">
                  {item.label}
                </div>

                {/* Stacked Bars */}
                <div className="w-full max-w-[42px] flex flex-col justify-end h-full gap-1">
                  {/* Late bar (Amber) */}
                  <div
                    className="w-full bg-amber-500/80 rounded-t group-hover:brightness-110 transition-all"
                    style={{ height: `${item.late * 1.2}%` }}
                  ></div>
                  {/* Present bar (Blue/Indigo gradient) */}
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-b group-hover:brightness-110 transition-all shadow-md shadow-blue-500/20"
                    style={{ height: `${item.present * 0.9}%` }}
                  ></div>
                </div>

                <span className="text-[11px] font-medium text-slate-400 mt-2 truncate max-w-full text-center">
                  {item.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-400">
          <span>Target SLA Enterprise: <strong>&ge; 95% Kehadiran</strong></span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +2.4% vs Minggu Lalu
          </span>
        </div>
      </div>

      {/* 1-Column: Department Punctuality Index */}
      <div className="enterprise-card rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Building2 className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">Kinerja Per Departemen</h4>
              <p className="text-xs text-slate-400">Indeks ketepatan waktu presensi</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {departmentPerformance.map((dept, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium truncate pr-2">{dept.name}</span>
                  <span className="font-mono font-bold text-white">{dept.rate}%</span>
                </div>

                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      dept.rate >= 95
                        ? 'bg-emerald-500'
                        : dept.rate >= 90
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${dept.rate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Evaluasi otomatis bulanan</span>
          <span className="text-blue-400 hover:underline cursor-pointer flex items-center gap-0.5 font-medium">
            Rincian Divisi <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}
