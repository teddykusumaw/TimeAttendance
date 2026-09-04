'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  FileSpreadsheet,
  Download,
  CalendarCheck,
  Clock,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import LivePunchCard from '@/components/attendance/LivePunchCard';
import EnterpriseKpis from '@/components/dashboard/EnterpriseKpis';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts';
import AttendanceLedgerTable from '@/components/attendance/AttendanceLedgerTable';
import BulkUploadModal from '@/components/attendance/BulkUploadModal';
import EmployeePortal from '@/components/portal/EmployeePortal';
import { attendanceRepo } from '@/lib/attendance-repository';
import { generateAttendanceTemplate, downloadExcelBlob } from '@/lib/excel-utils';

export default function DashboardPage() {
  const { currentUser, permissions, isLoggedIn } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setRefreshKey((k) => k + 1);
    window.addEventListener('attendance_updated', handleUpdate);
    return () => window.removeEventListener('attendance_updated', handleUpdate);
  }, []);

  const handleDownloadTemplate = () => {
    const users = attendanceRepo.getUsers();
    const shifts = attendanceRepo.getShifts();
    const branches = attendanceRepo.getBranches();
    const buffer = generateAttendanceTemplate(users, shifts, branches);
    downloadExcelBlob(buffer, 'Template_Presensi_Enterprise_Tier1.xlsx');
  };

  // Guard: if unauthenticated, AppShell will redirect to /login
  if (!isLoggedIn) {
    return null;
  }

  // Special Dedicated Employee Portal (Presensi Mandiri, Shift, & Riwayat Pribadi)
  // Employees are immediately presented with the employee portal and cannot access the admin dashboard
  if (currentUser.role === 'EMPLOYEE') {
    return <EmployeePortal />;
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome & Enterprise Overview Banner */}
      <div className="enterprise-card rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Tier 1 Enterprise Presence Engine • Neon PostgreSQL</span>
          </div>

          <h1 className="fluid-title font-extrabold text-white tracking-tight">
            Selamat Datang, {currentUser.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
            Sistem manajemen kehadiran presisi tinggi. Monitoring presensi harian, penjadwalan multi-shift,
            serta fasilitas integrasi data massal (Bulk Excel) berkecepatan tinggi.
          </p>
        </div>

        {/* Quick Hub Actions */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Template Excel (.xlsx)</span>
          </button>

          {permissions.canUploadBulkExcel && (
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-98"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Bulk Excel Upload</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Interactive Punch Terminal (Kios Presensi Mandiri) */}
      <div id="live-punch-terminal">
        <LivePunchCard onAttendanceUpdated={() => setRefreshKey((k) => k + 1)} />
      </div>

      {/* Enterprise KPI Cards */}
      <EnterpriseKpis refreshTrigger={refreshKey} />

      {/* Analytics Trend & Department Performance Breakdown */}
      <AnalyticsCharts />

      {/* Main Attendance Ledger Table */}
      <AttendanceLedgerTable
        onOpenBulkUpload={() => setIsBulkModalOpen(true)}
        onRefresh={() => setRefreshKey((k) => k + 1)}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
