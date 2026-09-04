import { Branch, Department, Shift, User, AttendanceRecord, LeaveRequest, AuditLog, BulkImportBatch } from '@/types';

export const INITIAL_BRANCHES: Branch[] = [];

export const INITIAL_DEPARTMENTS: Department[] = [];

export const INITIAL_SHIFTS: Shift[] = [];

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
  },
];


export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];
export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
export const INITIAL_IMPORT_BATCHES: BulkImportBatch[] = [];
