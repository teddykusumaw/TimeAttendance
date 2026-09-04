import { Branch, Department, Shift, User, AttendanceRecord, LeaveRequest, AuditLog, BulkImportBatch } from '@/types';

export const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'b-1',
    code: 'HQ-JKT',
    name: 'Headquarter Sudirman',
    city: 'Jakarta Selatan',
    timezone: 'Asia/Jakarta',
    latitude: -6.2146,
    longitude: 106.8214,
    radiusMeters: 150,
  },
  {
    id: 'b-2',
    code: 'SUB-HUB',
    name: 'Surabaya Tech & Operations',
    city: 'Surabaya',
    timezone: 'Asia/Jakarta',
    latitude: -7.2575,
    longitude: 112.7521,
    radiusMeters: 200,
  },
  {
    id: 'b-3',
    code: 'BDG-RND',
    name: 'Bandung R&D Digital Center',
    city: 'Bandung',
    timezone: 'Asia/Jakarta',
    latitude: -6.9175,
    longitude: 107.6191,
    radiusMeters: 250,
  },
];

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'd-1', code: 'ENG', name: 'Software Engineering & IT', branchId: 'b-1' },
  { id: 'd-2', code: 'HRD', name: 'Human Resource & People Ops', branchId: 'b-1' },
  { id: 'd-3', code: 'FIN', name: 'Finance & Accounting', branchId: 'b-1' },
  { id: 'd-4', code: 'OPS', name: 'Operations & Logistics', branchId: 'b-2' },
  { id: 'd-5', code: 'PRD', name: 'Product & Design', branchId: 'b-3' },
];

export const INITIAL_SHIFTS: Shift[] = [
  {
    id: 's-1',
    code: 'STD-0817',
    name: 'Standard Office (08:00 - 17:00)',
    startTime: '08:00',
    endTime: '17:00',
    gracePeriodMins: 15,
    breakMins: 60,
    isFlexible: false,
    workDays: 'MON,TUE,WED,THU,FRI',
  },
  {
    id: 's-2',
    code: 'MORN-0615',
    name: 'Morning Shift (06:00 - 15:00)',
    startTime: '06:00',
    endTime: '15:00',
    gracePeriodMins: 10,
    breakMins: 60,
    isFlexible: false,
    workDays: 'MON,TUE,WED,THU,FRI,SAT',
  },
  {
    id: 's-3',
    code: 'EVE-1423',
    name: 'Evening Shift (14:00 - 23:00)',
    startTime: '14:00',
    endTime: '23:00',
    gracePeriodMins: 10,
    breakMins: 60,
    isFlexible: false,
    workDays: 'MON,TUE,WED,THU,FRI,SAT',
  },
  {
    id: 's-4',
    code: 'FLEX-CORE',
    name: 'Flexible Core Hours (40h/week)',
    startTime: '09:00',
    endTime: '18:00',
    gracePeriodMins: 30,
    breakMins: 60,
    isFlexible: true,
    workDays: 'MON,TUE,WED,THU,FRI',
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-superuser-01',
    employeeCode: 'SA-0001',
    email: 'teddykusumawirawan81@gmail.com',
    fullName: 'Teddy Kusuma Wirawan',
    role: 'SUPER_ADMIN',
    jobTitle: 'Chief Executive / Super Administrator',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+62 811-9988-7766',
    isActive: true,
    branchId: 'b-1',
    branchName: 'Headquarter Sudirman',
    departmentId: 'd-1',
    departmentName: 'Executive & Management',
    shiftId: 's-1',
    shiftName: 'Standard Office (08:00 - 17:00)',
  },
];


export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];
export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
export const INITIAL_IMPORT_BATCHES: BulkImportBatch[] = [];
