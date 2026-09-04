import * as XLSX from 'xlsx';
import { BulkImportRow, User, Shift, Branch, AttendanceRecord } from '@/types';

export interface ValidationSummary {
  totalRows: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  rows: BulkImportRow[];
}

/**
 * Generates an enterprise-standard Excel template with sample data & data dictionary.
 */
export function generateAttendanceTemplate(
  users: User[],
  shifts: Shift[],
  branches: Branch[]
): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Template data entry
  const templateHeaders = [
    'Employee_ID',
    'Employee_Name',
    'Attendance_Date',
    'Check_In_Time',
    'Check_Out_Time',
    'Shift_Code',
    'Branch_Code',
    'Notes',
  ];

  const sampleRows = [
    {
      Employee_ID: 'EMP-0004',
      Employee_Name: 'Dimas Anggara',
      Attendance_Date: '2026-09-04',
      Check_In_Time: '07:55',
      Check_Out_Time: '17:05',
      Shift_Code: 'STD-0817',
      Branch_Code: 'HQ-JKT',
      Notes: 'Presensi harian on-site',
    },
    {
      Employee_ID: 'EMP-0005',
      Employee_Name: 'Nadia Saphira',
      Attendance_Date: '2026-09-04',
      Check_In_Time: '08:20',
      Check_Out_Time: '17:30',
      Shift_Code: 'STD-0817',
      Branch_Code: 'HQ-JKT',
      Notes: 'Sedikit terlambat karena kemacetan',
    },
    {
      Employee_ID: 'EMP-0006',
      Employee_Name: 'Fajar Hidayat',
      Attendance_Date: '2026-09-04',
      Check_In_Time: '05:50',
      Check_Out_Time: '15:10',
      Shift_Code: 'MORN-0615',
      Branch_Code: 'SUB-HUB',
      Notes: 'Shift pagi operasional Surabaya',
    },
    {
      Employee_ID: 'EMP-0007',
      Employee_Name: 'Siti Aliyah Putri',
      Attendance_Date: '2026-09-04',
      Check_In_Time: '09:00',
      Check_Out_Time: '18:00',
      Shift_Code: 'FLEX-CORE',
      Branch_Code: 'BDG-RND',
      Notes: 'Shift Fleksibel R&D Bandung',
    },
  ];

  const wsTemplate = XLSX.utils.json_to_sheet(sampleRows, { header: templateHeaders });
  // Set column widths for clean readability
  wsTemplate['!cols'] = [
    { wch: 15 }, // Employee_ID
    { wch: 22 }, // Employee_Name
    { wch: 16 }, // Attendance_Date
    { wch: 16 }, // Check_In_Time
    { wch: 16 }, // Check_Out_Time
    { wch: 14 }, // Shift_Code
    { wch: 14 }, // Branch_Code
    { wch: 30 }, // Notes
  ];
  XLSX.utils.book_append_sheet(wb, wsTemplate, 'Attendance_Data');

  // Sheet 2: Reference Dictionary (Employee IDs, Shifts, Branches)
  const employeeRef = users.map((u) => ({
    Employee_ID: u.employeeCode,
    Full_Name: u.fullName,
    Department: u.departmentName || '',
    Branch: u.branchName || '',
  }));
  const wsEmployees = XLSX.utils.json_to_sheet(employeeRef);
  wsEmployees['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsEmployees, 'Ref_Employees');

  const shiftRef = shifts.map((s) => ({
    Shift_Code: s.code,
    Shift_Name: s.name,
    Schedule: `${s.startTime} - ${s.endTime}`,
    Grace_Period_Mins: s.gracePeriodMins,
  }));
  const wsShifts = XLSX.utils.json_to_sheet(shiftRef);
  wsShifts['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsShifts, 'Ref_Shifts');

  const branchRef = branches.map((b) => ({
    Branch_Code: b.code,
    Branch_Name: b.name,
    City: b.city,
  }));
  const wsBranches = XLSX.utils.json_to_sheet(branchRef);
  wsBranches['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsBranches, 'Ref_Branches');

  // Sheet 3: Instructions & Rules
  const instructions = [
    { No: 1, Field: 'Employee_ID', Requirement: 'WAJIB', Format: 'Harus terdaftar di Ref_Employees (contoh: EMP-0004)' },
    { No: 2, Field: 'Attendance_Date', Requirement: 'WAJIB', Format: 'Format YYYY-MM-DD (contoh: 2026-09-04)' },
    { No: 3, Field: 'Check_In_Time', Requirement: 'WAJIB', Format: 'Format 24 Jam HH:mm (contoh: 07:55)' },
    { No: 4, Field: 'Check_Out_Time', Requirement: 'OPSIONAL', Format: 'Format 24 Jam HH:mm (contoh: 17:05). Kosong jika shift masih berjalan' },
    { No: 5, Field: 'Shift_Code', Requirement: 'OPSIONAL', Format: 'Kode Shift valid dari Ref_Shifts (default: STD-0817)' },
    { No: 6, Field: 'Branch_Code', Requirement: 'OPSIONAL', Format: 'Kode Cabang dari Ref_Branches (default: cabang karyawan)' },
    { No: 7, Field: 'Notes', Requirement: 'OPSIONAL', Format: 'Catatan keterangan khusus presensi' },
  ];
  const wsInst = XLSX.utils.json_to_sheet(instructions);
  wsInst['!cols'] = [{ wch: 5 }, { wch: 18 }, { wch: 14 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsInst, 'Petunjuk_Pengisian');

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

/**
 * Multi-pass validation engine for bulk uploaded attendance files.
 */
export function validateBulkAttendanceExcel(
  fileBuffer: ArrayBuffer,
  users: User[],
  shifts: Shift[],
  branches: Branch[]
): ValidationSummary {
  const wb = XLSX.read(fileBuffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  // Convert to JSON
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const userMap = new Map(users.map((u) => [u.employeeCode.trim().toUpperCase(), u]));
  const shiftMap = new Map(shifts.map((s) => [s.code.trim().toUpperCase(), s]));
  const branchMap = new Map(branches.map((b) => [b.code.trim().toUpperCase(), b]));

  const validatedRows: BulkImportRow[] = [];
  let validCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // Excel row index (header is 1)
    const messages: string[] = [];
    let status: 'VALID' | 'WARNING' | 'ERROR' = 'VALID';

    // Normalize keys (support case-insensitive & spaces)
    const normalized: Record<string, string> = {};
    for (const key of Object.keys(row)) {
      const cleanKey = key.trim().toLowerCase().replace(/[\s_-]+/g, '');
      normalized[cleanKey] = String(row[key]).trim();
    }

    const employeeCode = (
      normalized['employeeid'] ||
      normalized['nik'] ||
      normalized['employeecode'] ||
      ''
    ).toUpperCase();

    const dateStr =
      normalized['attendancedate'] ||
      normalized['date'] ||
      normalized['tanggal'] ||
      '';

    let checkIn =
      normalized['checkintime'] ||
      normalized['checkin'] ||
      normalized['masuk'] ||
      '';

    let checkOut =
      normalized['checkouttime'] ||
      normalized['checkout'] ||
      normalized['pulang'] ||
      '';

    const shiftCode = (
      normalized['shiftcode'] ||
      normalized['shift'] ||
      ''
    ).toUpperCase();

    const branchCode = (
      normalized['branchcode'] ||
      normalized['branch'] ||
      normalized['cabang'] ||
      ''
    ).toUpperCase();

    const notes = normalized['notes'] || normalized['keterangan'] || '';

    // 1. Validate Employee
    if (!employeeCode) {
      status = 'ERROR';
      messages.push('Employee ID / NIK wajib diisi.');
    } else if (!userMap.has(employeeCode)) {
      status = 'ERROR';
      messages.push(`Employee ID "${employeeCode}" tidak terdaftar dalam sistem.`);
    }

    const matchedUser = userMap.get(employeeCode);

    // 2. Validate Date
    if (!dateStr) {
      status = 'ERROR';
      messages.push('Tanggal absensi wajib diisi.');
    } else {
      // Basic format check
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateStr)) {
        // Try parsing serial date if from Excel
        const parsedDate = new Date(dateStr);
        if (isNaN(parsedDate.getTime())) {
          status = 'ERROR';
          messages.push(`Format tanggal "${dateStr}" tidak valid (Gunakan YYYY-MM-DD).`);
        }
      }
    }

    // 3. Validate Check-In Time
    if (!checkIn) {
      status = 'ERROR';
      messages.push('Jam Masuk (Check-In) wajib diisi.');
    } else {
      // Normalize time if e.g. "8:00" -> "08:00"
      if (/^\d{1,2}:\d{2}$/.test(checkIn)) {
        const parts = checkIn.split(':');
        checkIn = `${parts[0].padStart(2, '0')}:${parts[1]}`;
      } else {
        status = 'ERROR';
        messages.push(`Format Jam Masuk "${checkIn}" tidak valid (Gunakan HH:mm 24 Jam).`);
      }
    }

    // 4. Validate Check-Out Time (if present)
    if (checkOut) {
      if (/^\d{1,2}:\d{2}$/.test(checkOut)) {
        const parts = checkOut.split(':');
        checkOut = `${parts[0].padStart(2, '0')}:${parts[1]}`;

        // Check if checkout < checkin
        if (status !== 'ERROR' && checkIn && checkOut <= checkIn) {
          status = 'WARNING';
          messages.push(`Jam Pulang (${checkOut}) lebih awal atau sama dengan Jam Masuk (${checkIn}).`);
        }
      } else {
        status = 'ERROR';
        messages.push(`Format Jam Pulang "${checkOut}" tidak valid (Gunakan HH:mm 24 Jam).`);
      }
    } else {
      if (status !== 'ERROR') {
        // Warning: ongoing shift without checkout
        status = 'WARNING';
        messages.push('Jam Pulang belum terisi (Shift aktif/belum checkout).');
      }
    }

    // 5. Shift & Grace period check
    if (shiftCode && !shiftMap.has(shiftCode)) {
      if (status !== 'ERROR') status = 'WARNING';
      messages.push(`Shift Code "${shiftCode}" tidak dikenal, sistem akan menggunakan shift default.`);
    }

    // 6. Branch check
    if (branchCode && !branchMap.has(branchCode)) {
      if (status !== 'ERROR') status = 'WARNING';
      messages.push(`Branch Code "${branchCode}" tidak dikenal, sistem akan menggunakan cabang default karyawan.`);
    }

    // Count statistics
    if (status === 'ERROR') {
      errorCount++;
    } else if (status === 'WARNING') {
      warningCount++;
    } else {
      validCount++;
    }

    validatedRows.push({
      rowNumber: rowNum,
      employeeCode: employeeCode || '-',
      employeeName: matchedUser ? matchedUser.fullName : (row['Employee_Name'] || '-'),
      date: dateStr,
      checkInTime: checkIn,
      checkOutTime: checkOut,
      shiftCode: shiftCode || matchedUser?.shiftName || 'STD-0817',
      branchCode: branchCode || matchedUser?.branchName || 'HQ-JKT',
      notes: notes || undefined,
      status,
      messages,
    });
  });

  return {
    totalRows: rawRows.length,
    validCount,
    warningCount,
    errorCount,
    rows: validatedRows,
  };
}

/**
 * Exports attendance records to formatted Excel spreadsheet.
 */
export function exportAttendanceToExcel(records: AttendanceRecord[]): Uint8Array {
  const wb = XLSX.utils.book_new();

  const formattedRows = records.map((r) => ({
    NIK: r.employeeCode,
    Nama_Karyawan: r.employeeName,
    Departemen: r.departmentName,
    Cabang: r.branchName,
    Tanggal: r.date,
    Jam_Masuk: r.checkIn ? r.checkIn.split('T')[1]?.slice(0, 5) || r.checkIn : '-',
    Jam_Pulang: r.checkOut ? r.checkOut.split('T')[1]?.slice(0, 5) || r.checkOut : '-',
    Status_Kehadiran: r.status,
    Keterlambatan_Menit: r.lateMinutes,
    Lembur_Menit: r.overtimeMinutes,
    Jam_Kerja_Efektif: r.effectiveWorkHours,
    Metode_Presensi: r.verificationMethod,
    Catatan: r.notes || '',
  }));

  const ws = XLSX.utils.json_to_sheet(formattedRows);
  ws['!cols'] = [
    { wch: 14 }, // NIK
    { wch: 24 }, // Nama
    { wch: 24 }, // Departemen
    { wch: 22 }, // Cabang
    { wch: 14 }, // Tanggal
    { wch: 12 }, // Jam_Masuk
    { wch: 12 }, // Jam_Pulang
    { wch: 18 }, // Status
    { wch: 20 }, // Late mins
    { wch: 16 }, // OT mins
    { wch: 18 }, // Effective hours
    { wch: 18 }, // Method
    { wch: 30 }, // Catatan
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Presensi');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

/**
 * Exports only failed rows with error descriptions for easy correction by user.
 */
export function exportFailedRowsReport(failedRows: BulkImportRow[]): Uint8Array {
  const wb = XLSX.utils.book_new();

  const exportRows = failedRows.map((r) => ({
    Baris_Excel: r.rowNumber,
    Employee_ID: r.employeeCode,
    Employee_Name: r.employeeName || '',
    Attendance_Date: r.date,
    Check_In_Time: r.checkInTime,
    Check_Out_Time: r.checkOutTime,
    Shift_Code: r.shiftCode || '',
    Branch_Code: r.branchCode || '',
    Keterangan_Error: r.messages.join(' | '),
  }));

  const ws = XLSX.utils.json_to_sheet(exportRows);
  ws['!cols'] = [
    { wch: 12 },
    { wch: 16 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 50 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Error_Report');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}

/**
 * Utility helper to download an Excel buffer as a file in browser.
 */
export function downloadExcelBlob(data: Uint8Array | ArrayBuffer, filename: string) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([data as any], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

