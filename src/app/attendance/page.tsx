'use client';

import React, { useState } from 'react';
import AttendanceLedgerTable from '@/components/attendance/AttendanceLedgerTable';
import BulkUploadModal from '@/components/attendance/BulkUploadModal';
import LivePunchCard from '@/components/attendance/LivePunchCard';
import { CalendarCheck, ShieldCheck } from 'lucide-react';

export default function AttendancePage() {
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <CalendarCheck className="w-4 h-4" />
            <span>Presensi & Catatan Kehadiran</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Ledger Presensi & Waktu Kerja
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pantau seluruh presensi harian, jam lembur, serta histori kedisiplinan karyawan per unit kerja.
          </p>
        </div>
      </div>

      <LivePunchCard onAttendanceUpdated={() => setRefreshKey((k) => k + 1)} />

      <AttendanceLedgerTable
        key={refreshKey}
        onOpenBulkUpload={() => setIsBulkModalOpen(true)}
        onRefresh={() => setRefreshKey((k) => k + 1)}
      />

      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
