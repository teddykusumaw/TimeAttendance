export type Role = 'SUPER_ADMIN' | 'HR_ADMIN' | 'MANAGER' | 'EMPLOYEE';

export type AttendanceStatus =
  | 'PRESENT'
  | 'LATE'
  | 'EARLY_DEPARTURE'
  | 'ABSENT'
  | 'ON_LEAVE'
  | 'OVERTIME';

export type VerificationMethod =
  | 'WEB_KIOSK'
  | 'BULK_EXCEL'
  | 'BIOMETRIC_SIM'
  | 'MOBILE_GEO'
  | 'FACIAL_RECOG';

export type LeaveStatus =
  | 'PENDING'
  | 'MANAGER_APPROVED'
  | 'HR_APPROVED'
  | 'REJECTED';

export interface User {
  id: string;
  employeeCode: string;
  email: string;
  fullName: string;
  role: Role;
  jobTitle: string;
  avatarUrl?: string;
  phone?: string;
  isActive: boolean;
  branchId: string;
  branchName?: string;
  departmentId: string;
  departmentName?: string;
  shiftId?: string;
  shiftName?: string;
  // Device (HP) Binding fields
  boundDeviceId?: string | null;
  boundDeviceName?: string | null;
  boundDeviceAt?: string | null;
  // Face Recognition Biometrics fields
  facePhotoUrl?: string | null;
  faceEnrolledAt?: string | null;
}

export interface Shift {
  id: string;
  code: string;
  name: string;
  startTime: string; // e.g. "08:00"
  endTime: string;   // e.g. "17:00"
  gracePeriodMins: number;
  breakMins: number;
  isFlexible: boolean;
  workDays: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
  radiusMeters: number;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  branchId: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  branchName: string;
  shiftName: string;
  date: string; // YYYY-MM-DD
  checkIn?: string | null; // ISO string or HH:mm
  checkOut?: string | null;
  status: AttendanceStatus;
  lateMinutes: number;
  earlyMinutes: number;
  overtimeMinutes: number;
  effectiveWorkHours: number;
  verificationMethod: VerificationMethod;
  photoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  ipAddress?: string | null;
  notes?: string | null;
  importBatchId?: string | null;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  leaveType: 'ANNUAL' | 'SICK' | 'MATERNITY' | 'SPECIAL' | 'UNPAID';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface BulkImportRow {
  rowNumber: number;
  employeeCode: string;
  employeeName?: string;
  date: string;
  checkInTime: string;
  checkOutTime: string;
  shiftCode?: string;
  branchCode?: string;
  notes?: string;
  // Validation output
  status: 'VALID' | 'WARNING' | 'ERROR';
  messages: string[];
}

export interface BulkImportBatch {
  id: string;
  fileName: string;
  fileSize: number;
  totalRows: number;
  successCount: number;
  errorCount: number;
  warningCount: number;
  uploadedByName: string;
  uploadedByRole: Role;
  createdAt: string;
  errorSummary?: string | null;
}

export interface AttendanceFilters {
  searchQuery: string;
  departmentId: string;
  branchId: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  shiftId: string;
}

export interface DashboardMetrics {
  totalEmployees: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  onLeaveToday: number;
  attendanceRate: number; // percentage
  averageLateMinutes: number;
  totalOvertimeHours: number;
}
