'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  ArrowRight,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { attendanceRepo } from '@/lib/attendance-repository';
import {
  generateAttendanceTemplate,
  validateBulkAttendanceExcel,
  exportFailedRowsReport,
  downloadExcelBlob,
  ValidationSummary,
} from '@/lib/excel-utils';
import { BulkImportRow } from '@/types';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkUploadModal({ isOpen, onClose, onSuccess }: BulkUploadModalProps) {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationSummary | null>(null);
  const [filterTab, setFilterTab] = useState<'ALL' | 'VALID' | 'WARNING' | 'ERROR'>('ALL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importCompleted, setImportCompleted] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  if (!isOpen) return null;

  // Template Download Handler
  const handleDownloadTemplate = () => {
    const users = attendanceRepo.getUsers();
    const shifts = attendanceRepo.getShifts();
    const branches = attendanceRepo.getBranches();
    const buffer = generateAttendanceTemplate(users, shifts, branches);
    downloadExcelBlob(buffer, 'Template_Presensi_Enterprise_Tier1.xlsx');
  };

  // File Upload & Validation Handler
  const handleFileChange = async (file: File) => {
    if (!file) return;
    setSelectedFile(file);
    setIsProcessing(true);
    setImportCompleted(false);

    try {
      const buffer = await file.arrayBuffer();
      const users = attendanceRepo.getUsers();
      const shifts = attendanceRepo.getShifts();
      const branches = attendanceRepo.getBranches();

      const result = validateBulkAttendanceExcel(buffer, users, shifts, branches);
      setValidationResult(result);
    } catch (err) {
      console.error('Failed to parse Excel file', err);
      alert('Gagal membaca file Excel. Pastikan file berformat .xlsx atau .xls yang valid.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Commit Import to Database
  const handleCommit = () => {
    if (!validationResult || !selectedFile) return;

    setIsProcessing(true);
    setTimeout(() => {
      const res = attendanceRepo.commitBulkImport(validationResult.rows, {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        uploadedBy: currentUser,
      });

      setImportedCount(res.insertedCount);
      setImportCompleted(true);
      setIsProcessing(false);
      onSuccess();
    }, 600);
  };

  // Download Error Report
  const handleDownloadErrors = () => {
    if (!validationResult) return;
    const errorRows = validationResult.rows.filter((r) => r.status === 'ERROR');
    if (errorRows.length === 0) return;

    const buffer = exportFailedRowsReport(errorRows);
    downloadExcelBlob(buffer, `Error_Report_${selectedFile?.name || 'Import'}.xlsx`);
  };


  const filteredRows = validationResult?.rows.filter((row) => {
    if (filterTab === 'ALL') return true;
    return row.status === filterTab;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Bulk Excel Attendance Import (Tier 1)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Impor data presensi massal dengan sistem multi-pass validator otomatis & laporan preview.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-5">
          {/* Action Bar: Download Template Alert */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-slate-900/50 to-indigo-950/30 border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Butuh Format Excel Standar?</h4>
                <p className="text-[11px] text-slate-400">
                  Unduh template resmi yang sudah dilengkapi kamus NIK karyawan, shift, dan cabang.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template (.xlsx)</span>
            </button>
          </div>

          {/* Drag & Drop File Zone */}
          {!importCompleted && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                selectedFile
                  ? 'border-blue-500/40 bg-blue-950/10'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-3">
                <Upload className="w-6 h-6 text-blue-400" />
              </div>

              <p className="text-sm font-semibold text-white">
                {selectedFile ? selectedFile.name : 'Tarik & Letakkan File Excel di Sini'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Mendukung format <span className="text-slate-300 font-mono">.xlsx</span>,{' '}
                <span className="text-slate-300 font-mono">.xls</span>, atau{' '}
                <span className="text-slate-300 font-mono">.csv</span> (Maks. 15MB)
              </p>
              {selectedFile && (
                <p className="text-[11px] text-blue-400 mt-2 font-medium">
                  Ukuran: {(selectedFile.size / 1024).toFixed(1)} KB — Klik untuk mengganti file
                </p>
              )}
            </div>
          )}

          {/* Validation Metrics & Data Grid Preview */}
          {validationResult && !importCompleted && (
            <div className="space-y-4">
              {/* Validation Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-medium">Total Baris</span>
                  <p className="text-lg font-bold text-white mt-0.5">{validationResult.totalRows}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                  <span className="text-[11px] text-emerald-400 font-medium">Valid (Siap Simpan)</span>
                  <p className="text-lg font-bold text-emerald-400 mt-0.5">{validationResult.validCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20">
                  <span className="text-[11px] text-amber-400 font-medium">Peringatan (Warnings)</span>
                  <p className="text-lg font-bold text-amber-400 mt-0.5">{validationResult.warningCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20">
                  <span className="text-[11px] text-rose-400 font-medium">Error (Akan Dilewati)</span>
                  <p className="text-lg font-bold text-rose-400 mt-0.5">{validationResult.errorCount}</p>
                </div>
              </div>

              {/* Filter Tabs & Error Download Action */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <button
                    onClick={() => setFilterTab('ALL')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      filterTab === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Semua ({validationResult.totalRows})
                  </button>
                  <button
                    onClick={() => setFilterTab('VALID')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      filterTab === 'VALID' ? 'bg-emerald-600/30 text-emerald-400' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Valid ({validationResult.validCount})
                  </button>
                  <button
                    onClick={() => setFilterTab('WARNING')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      filterTab === 'WARNING' ? 'bg-amber-600/30 text-amber-400' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Warnings ({validationResult.warningCount})
                  </button>
                  <button
                    onClick={() => setFilterTab('ERROR')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      filterTab === 'ERROR' ? 'bg-rose-600/30 text-rose-400' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Errors ({validationResult.errorCount})
                  </button>
                </div>

                {validationResult.errorCount > 0 && (
                  <button
                    onClick={handleDownloadErrors}
                    className="px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Laporan Baris Error</span>
                  </button>
                )}
              </div>

              {/* Preview Table */}
              <div className="rounded-xl border border-slate-800 overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5 font-semibold">Baris</th>
                      <th className="p-2.5 font-semibold">Status</th>
                      <th className="p-2.5 font-semibold">NIK</th>
                      <th className="p-2.5 font-semibold">Nama</th>
                      <th className="p-2.5 font-semibold">Tanggal</th>
                      <th className="p-2.5 font-semibold">In / Out</th>
                      <th className="p-2.5 font-semibold">Keterangan / Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                    {filteredRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={
                          row.status === 'ERROR'
                            ? 'bg-rose-950/10'
                            : row.status === 'WARNING'
                            ? 'bg-amber-950/10'
                            : 'hover:bg-slate-900/30'
                        }
                      >
                        <td className="p-2.5 text-slate-400 font-mono">#{row.rowNumber}</td>
                        <td className="p-2.5">
                          {row.status === 'VALID' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              VALID
                            </span>
                          ) : row.status === 'WARNING' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              WARNING
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              ERROR
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-slate-300">{row.employeeCode}</td>
                        <td className="p-2.5 text-white font-medium">{row.employeeName || '-'}</td>
                        <td className="p-2.5 text-slate-300 font-mono">{row.date}</td>
                        <td className="p-2.5 text-slate-300 font-mono">
                          {row.checkInTime || '--:--'} → {row.checkOutTime || '--:--'}
                        </td>
                        <td className="p-2.5">
                          {row.messages.length > 0 ? (
                            <span
                              className={`text-[11px] ${
                                row.status === 'ERROR'
                                  ? 'text-rose-400'
                                  : row.status === 'WARNING'
                                  ? 'text-amber-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {row.messages.join('; ')}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Format sesuai</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Success View */}
          {importCompleted && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Impor Massal Berhasil Disimpan!</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Sebanyak <strong className="text-emerald-400">{importedCount} baris presensi</strong> telah berhasil
                  disimpan dan terintegrasi ke dalam ledger absensi perusahaan.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {importCompleted ? 'Selesai & Tutup' : 'Batal'}
          </button>

          {!importCompleted && validationResult && (
            <button
              onClick={handleCommit}
              disabled={isProcessing || (validationResult.validCount === 0 && validationResult.warningCount === 0)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <span>Simpan {validationResult.validCount + validationResult.warningCount} Baris ke Database</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
