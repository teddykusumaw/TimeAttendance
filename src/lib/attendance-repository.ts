import {
  AttendanceRecord,
  AttendanceFilters,
  DashboardMetrics,
  User,
  Shift,
  Branch,
  Department,
  LeaveRequest,
  AuditLog,
  BulkImportBatch,
  BulkImportRow,
  Role,
} from '@/types';
import {
  INITIAL_ATTENDANCE,
  INITIAL_USERS,
  INITIAL_SHIFTS,
  INITIAL_BRANCHES,
  INITIAL_DEPARTMENTS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_IMPORT_BATCHES,
} from './mock-data';

// Key for browser localStorage persistence
const STORAGE_PREFIX = 'tier1_time_attendance_';

class AttendanceRepository {
  private attendance: AttendanceRecord[] = [...INITIAL_ATTENDANCE];
  private users: User[] = [...INITIAL_USERS];
  private shifts: Shift[] = [...INITIAL_SHIFTS];
  private branches: Branch[] = [...INITIAL_BRANCHES];
  private departments: Department[] = [...INITIAL_DEPARTMENTS];
  private leaveRequests: LeaveRequest[] = [...INITIAL_LEAVE_REQUESTS];
  private auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];
  private batches: BulkImportBatch[] = [...INITIAL_IMPORT_BATCHES];
  private isInitialized = false;

  constructor() {
    this.initFromStorage();
  }

  private initFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const storedAtt = localStorage.getItem(`${STORAGE_PREFIX}attendance`);
      if (storedAtt) this.attendance = JSON.parse(storedAtt);

      const storedBatches = localStorage.getItem(`${STORAGE_PREFIX}batches`);
      if (storedBatches) this.batches = JSON.parse(storedBatches);

      const storedLogs = localStorage.getItem(`${STORAGE_PREFIX}logs`);
      if (storedLogs) this.auditLogs = JSON.parse(storedLogs);

      const storedLeaves = localStorage.getItem(`${STORAGE_PREFIX}leaves`);
      if (storedLeaves) this.leaveRequests = JSON.parse(storedLeaves);

      this.isInitialized = true;
    } catch (e) {
      console.error('Failed to load local repository state', e);
    }
  }

  private syncToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}attendance`, JSON.stringify(this.attendance));
      localStorage.setItem(`${STORAGE_PREFIX}batches`, JSON.stringify(this.batches));
      localStorage.setItem(`${STORAGE_PREFIX}logs`, JSON.stringify(this.auditLogs));
      localStorage.setItem(`${STORAGE_PREFIX}leaves`, JSON.stringify(this.leaveRequests));
    } catch (e) {
      console.error('Failed to sync to localStorage', e);
    }
  }

  // --- Attendance Queries & Actions ---

  public getAttendanceRecords(filters?: Partial<AttendanceFilters>): AttendanceRecord[] {
    let result = [...this.attendance];

    if (!filters) return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.employeeName.toLowerCase().includes(q) ||
          r.employeeCode.toLowerCase().includes(q) ||
          r.departmentName.toLowerCase().includes(q)
      );
    }

    if (filters.branchId && filters.branchId !== 'ALL') {
      const branch = this.branches.find((b) => b.id === filters.branchId);
      if (branch) {
        result = result.filter((r) => r.branchName === branch.name);
      }
    }

    if (filters.departmentId && filters.departmentId !== 'ALL') {
      const dept = this.departments.find((d) => d.id === filters.departmentId);
      if (dept) {
        result = result.filter((r) => r.departmentName === dept.name);
      }
    }

    if (filters.status && filters.status !== 'ALL') {
      result = result.filter((r) => r.status === filters.status);
    }

    if (filters.dateFrom) {
      result = result.filter((r) => r.date >= (filters.dateFrom as string));
    }

    if (filters.dateTo) {
      result = result.filter((r) => r.date <= (filters.dateTo as string));
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public getEmployeeTodayRecord(userId: string): AttendanceRecord | undefined {
    const today = new Date().toISOString().split('T')[0];
    return this.attendance.find((r) => r.userId === userId && r.date === today);
  }

  public punchIn(
    user: User,
    options: {
      notes?: string;
      photoUrl?: string;
      method?: 'WEB_KIOSK' | 'MOBILE_GEO';
      latitude?: number;
      longitude?: number;
    }
  ): { success: boolean; record: AttendanceRecord; message: string } {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const existing = this.attendance.find((r) => r.userId === user.id && r.date === today);

    if (existing && existing.checkIn) {
      return { success: false, record: existing, message: 'Karyawan sudah melakukan Check-In hari ini.' };
    }

    const shift = this.shifts.find((s) => s.id === user.shiftId) || this.shifts[0];
    const [shiftHour, shiftMinute] = shift.startTime.split(':').map(Number);
    const shiftStartTime = new Date(now);
    shiftStartTime.setHours(shiftHour, shiftMinute, 0, 0);

    const diffMinutes = Math.round((now.getTime() - shiftStartTime.getTime()) / 60000);
    const isLate = diffMinutes > shift.gracePeriodMins;
    const lateMinutes = isLate ? diffMinutes : 0;

    const newRecord: AttendanceRecord = {
      id: existing ? existing.id : `att-${Date.now()}`,
      userId: user.id,
      employeeCode: user.employeeCode,
      employeeName: user.fullName,
      departmentName: user.departmentName || 'Engineering',
      branchName: user.branchName || 'Headquarter Sudirman',
      shiftName: shift.name,
      date: today,
      checkIn: now.toISOString(),
      checkOut: null,
      status: isLate ? 'LATE' : 'PRESENT',
      lateMinutes,
      earlyMinutes: 0,
      overtimeMinutes: 0,
      effectiveWorkHours: 0,
      verificationMethod: options.method || 'WEB_KIOSK',
      photoUrl: options.photoUrl || null,
      latitude: options.latitude || null,
      longitude: options.longitude || null,
      ipAddress: '127.0.0.1 (On-Premise Kiosk)',
      notes: options.notes || (isLate ? `Terlambat ${lateMinutes} menit (Toleransi ${shift.gracePeriodMins} mnt)` : 'Hadir tepat waktu'),
      createdAt: now.toISOString(),
    };

    if (existing) {
      const idx = this.attendance.findIndex((r) => r.id === existing.id);
      this.attendance[idx] = newRecord;
    } else {
      this.attendance.unshift(newRecord);
    }

    this.logAudit({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'PUNCH_IN',
      entityType: 'AttendanceRecord',
      entityId: newRecord.id,
      details: `Presensi Masuk pada ${now.toLocaleTimeString('id-ID')} (${newRecord.status})`,
    });

    this.syncToStorage();
    return {
      success: true,
      record: newRecord,
      message: isLate
        ? `Presensi masuk tercatat: Terlambat ${lateMinutes} menit.`
        : 'Presensi masuk berhasil! Anda hadir tepat waktu.',
    };
  }

  public punchOut(
    user: User,
    options: { notes?: string }
  ): { success: boolean; record?: AttendanceRecord; message: string } {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const recordIdx = this.attendance.findIndex((r) => r.userId === user.id && r.date === today);

    if (recordIdx === -1 || !this.attendance[recordIdx].checkIn) {
      return { success: false, message: 'Anda belum melakukan Check-In masuk hari ini.' };
    }

    const record = this.attendance[recordIdx];
    if (record.checkOut) {
      return { success: false, record, message: 'Anda sudah melakukan Check-Out sebelumnya.' };
    }

    const shift = this.shifts.find((s) => s.name === record.shiftName) || this.shifts[0];
    const [endH, endM] = shift.endTime.split(':').map(Number);
    const shiftEndTime = new Date(now);
    shiftEndTime.setHours(endH, endM, 0, 0);

    const checkInTime = record.checkIn ? new Date(record.checkIn) : new Date();
    const totalWorkingMins = Math.max(0, Math.round((now.getTime() - checkInTime.getTime()) / 60000));
    const effectiveHours = Number((totalWorkingMins / 60).toFixed(2));


    const otMins = Math.max(0, Math.round((now.getTime() - shiftEndTime.getTime()) / 60000));
    const isOvertime = otMins >= 60; // minimum 1 hour OT threshold
    const isEarly = now.getTime() < shiftEndTime.getTime() - 15 * 60000;
    const earlyMins = isEarly ? Math.round((shiftEndTime.getTime() - now.getTime()) / 60000) : 0;

    let status = record.status;
    if (isOvertime) status = 'OVERTIME';
    else if (isEarly && status !== 'LATE') status = 'EARLY_DEPARTURE';

    const updated: AttendanceRecord = {
      ...record,
      checkOut: now.toISOString(),
      status,
      earlyMinutes: earlyMins,
      overtimeMinutes: otMins,
      effectiveWorkHours: effectiveHours,
      notes: options.notes ? `${record.notes || ''} | ${options.notes}` : record.notes,
    };

    this.attendance[recordIdx] = updated;

    this.logAudit({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: 'PUNCH_OUT',
      entityType: 'AttendanceRecord',
      entityId: updated.id,
      details: `Presensi Pulang pada ${now.toLocaleTimeString('id-ID')} (Durasi ${effectiveHours} jam, Lembur ${otMins} mnt)`,
    });

    this.syncToStorage();
    return {
      success: true,
      record: updated,
      message: `Presensi pulang berhasil. Durasi kerja: ${effectiveHours} jam.`,
    };
  }

  // --- Bulk Excel Import Batch Processing ---

  public commitBulkImport(
    rows: BulkImportRow[],
    batchMeta: { fileName: string; fileSize: number; uploadedBy: User }
  ): { batch: BulkImportBatch; insertedCount: number } {
    const validRows = rows.filter((r) => r.status !== 'ERROR');
    const batchId = `batch-${Date.now()}`;
    let insertedCount = 0;

    validRows.forEach((row) => {
      const user = this.users.find((u) => u.employeeCode.toUpperCase() === row.employeeCode.toUpperCase());
      if (!user) return;

      const datePart = row.date;
      const checkInISO = row.checkInTime ? `${datePart}T${row.checkInTime}:00.000Z` : null;
      const checkOutISO = row.checkOutTime ? `${datePart}T${row.checkOutTime}:00.000Z` : null;

      // Status calculation
      let lateMins = 0;
      let status: 'PRESENT' | 'LATE' | 'OVERTIME' = 'PRESENT';
      if (row.checkInTime > '08:15') {
        status = 'LATE';
        const [h, m] = row.checkInTime.split(':').map(Number);
        lateMins = Math.max(0, h * 60 + m - (8 * 60));
      }

      let effectiveHours = 8.0;
      if (row.checkInTime && row.checkOutTime) {
        const [inH, inM] = row.checkInTime.split(':').map(Number);
        const [outH, outM] = row.checkOutTime.split(':').map(Number);
        const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
        effectiveHours = Number(Math.max(0, (totalMinutes - 60) / 60).toFixed(2));
      }

      // Check if existing record for this user & date
      const existingIdx = this.attendance.findIndex((r) => r.userId === user.id && r.date === datePart);

      const record: AttendanceRecord = {
        id: existingIdx !== -1 ? this.attendance[existingIdx].id : `att-bulk-${Date.now()}-${insertedCount}`,
        userId: user.id,
        employeeCode: user.employeeCode,
        employeeName: user.fullName,
        departmentName: user.departmentName || 'Operations',
        branchName: user.branchName || 'Headquarter Sudirman',
        shiftName: row.shiftCode || 'Standard Office',
        date: datePart,
        checkIn: checkInISO,
        checkOut: checkOutISO,
        status,
        lateMinutes: lateMins,
        earlyMinutes: 0,
        overtimeMinutes: 0,
        effectiveWorkHours: effectiveHours,
        verificationMethod: 'BULK_EXCEL',
        notes: row.notes || `Diimpor via Bulk Excel: ${batchMeta.fileName}`,
        importBatchId: batchId,
        createdAt: new Date().toISOString(),
      };

      if (existingIdx !== -1) {
        this.attendance[existingIdx] = record;
      } else {
        this.attendance.unshift(record);
      }
      insertedCount++;
    });

    const errorCount = rows.filter((r) => r.status === 'ERROR').length;
    const warningCount = rows.filter((r) => r.status === 'WARNING').length;

    const newBatch: BulkImportBatch = {
      id: batchId,
      fileName: batchMeta.fileName,
      fileSize: batchMeta.fileSize,
      totalRows: rows.length,
      successCount: insertedCount,
      errorCount,
      warningCount,
      uploadedByName: batchMeta.uploadedBy.fullName,
      uploadedByRole: batchMeta.uploadedBy.role,
      createdAt: new Date().toISOString(),
      errorSummary: errorCount > 0 ? `${errorCount} baris bermasalah dilewati.` : null,
    };

    this.batches.unshift(newBatch);

    this.logAudit({
      actorId: batchMeta.uploadedBy.id,
      actorName: batchMeta.uploadedBy.fullName,
      actorRole: batchMeta.uploadedBy.role,
      action: 'BULK_EXCEL_IMPORT',
      entityType: 'BulkImportBatch',
      entityId: batchId,
      details: `Mengunggah file ${batchMeta.fileName} (${insertedCount}/${rows.length} baris tersimpan)`,
    });

    this.syncToStorage();
    return { batch: newBatch, insertedCount };
  }

  // --- Leaves & Overtime ---

  public getLeaveRequests(): LeaveRequest[] {
    return [...this.leaveRequests];
  }

  public submitLeaveRequest(data: Omit<LeaveRequest, 'id' | 'createdAt' | 'status' | 'approvedBy' | 'reviewNotes'>): LeaveRequest {
    const newRequest: LeaveRequest = {
      ...data,
      id: `lr-${Date.now()}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    this.leaveRequests.unshift(newRequest);
    this.syncToStorage();
    return newRequest;
  }

  public reviewLeaveRequest(
    id: string,
    action: 'APPROVE' | 'REJECT',
    reviewer: User,
    notes: string
  ): boolean {
    const idx = this.leaveRequests.findIndex((r) => r.id === id);
    if (idx === -1) return false;

    const req = this.leaveRequests[idx];
    const newStatus = action === 'APPROVE'
      ? (reviewer.role === 'SUPER_ADMIN' || reviewer.role === 'HR_ADMIN' ? 'HR_APPROVED' : 'MANAGER_APPROVED')
      : 'REJECTED';

    this.leaveRequests[idx] = {
      ...req,
      status: newStatus,
      approvedBy: `${reviewer.fullName} (${reviewer.role})`,
      reviewNotes: notes,
    };

    this.logAudit({
      actorId: reviewer.id,
      actorName: reviewer.fullName,
      actorRole: reviewer.role,
      action: action === 'APPROVE' ? 'LEAVE_APPROVE' : 'LEAVE_REJECT',
      entityType: 'LeaveRequest',
      entityId: id,
      details: `${action === 'APPROVE' ? 'Menyetujui' : 'Menolak'} pengajuan cuti ${req.employeeName}: ${notes}`,
    });

    this.syncToStorage();
    return true;
  }

  // --- Metrics & Analytics ---

  public getDashboardMetrics(): DashboardMetrics {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = this.attendance.filter((r) => r.date === today);

    const totalEmployees = this.users.length;
    const presentToday = todayRecords.filter((r) => r.status === 'PRESENT' || r.status === 'OVERTIME').length;
    const lateToday = todayRecords.filter((r) => r.status === 'LATE').length;
    const onLeaveToday = todayRecords.filter((r) => r.status === 'ON_LEAVE').length;
    const absentToday = Math.max(0, totalEmployees - (presentToday + lateToday + onLeaveToday));

    const totalAttending = presentToday + lateToday;
    const attendanceRate = totalEmployees > 0 ? Number(((totalAttending / totalEmployees) * 100).toFixed(1)) : 0;

    const lateRecords = todayRecords.filter((r) => r.lateMinutes > 0);
    const avgLate = lateRecords.length > 0
      ? Math.round(lateRecords.reduce((acc, r) => acc + r.lateMinutes, 0) / lateRecords.length)
      : 0;

    const totalOvertimeHours = Number(
      (this.attendance.reduce((acc, r) => acc + (r.overtimeMinutes || 0), 0) / 60).toFixed(1)
    );

    return {
      totalEmployees,
      presentToday,
      lateToday,
      absentToday,
      onLeaveToday,
      attendanceRate,
      averageLateMinutes: avgLate,
      totalOvertimeHours,
    };
  }

  // --- Getters for Domain Entities ---

  public getUsers(): User[] {
    return [...this.users];
  }

  public getShifts(): Shift[] {
    return [...this.shifts];
  }

  public getBranches(): Branch[] {
    return [...this.branches];
  }

  public getDepartments(): Department[] {
    return [...this.departments];
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  public getBatches(): BulkImportBatch[] {
    return [...this.batches];
  }

  private logAudit(entry: Omit<AuditLog, 'id' | 'createdAt'>) {
    const log: AuditLog = {
      ...entry,
      id: `log-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
  }
}

export const attendanceRepo = new AttendanceRepository();
