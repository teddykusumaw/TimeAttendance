import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BRANCHES = [
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

const DEPARTMENTS = [
  { id: 'd-1', code: 'ENG', name: 'Software Engineering & IT', branchId: 'b-1' },
  { id: 'd-2', code: 'HRD', name: 'Human Resource & People Ops', branchId: 'b-1' },
  { id: 'd-3', code: 'FIN', name: 'Finance & Accounting', branchId: 'b-1' },
  { id: 'd-4', code: 'OPS', name: 'Operations & Logistics', branchId: 'b-2' },
  { id: 'd-5', code: 'PRD', name: 'Product & Design', branchId: 'b-3' },
];

const SHIFTS = [
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

const USERS = [
  {
    id: 'u-1',
    employeeCode: 'EMP-0001',
    email: 'superadmin@enterprise.corp',
    fullName: 'Alexander Bramantyo',
    role: 'SUPER_ADMIN',
    jobTitle: 'VP of Technology & Systems',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+62 811-9988-100',
    branchId: 'b-1',
    departmentId: 'd-1',
    shiftId: 's-4',
    passwordHash: 'argon2id$enterprise$superadmin',
  },
  {
    id: 'u-2',
    employeeCode: 'EMP-0002',
    email: 'hr.admin@enterprise.corp',
    fullName: 'Clarissa Maharani',
    role: 'HR_ADMIN',
    jobTitle: 'Lead People Operations & Payroll',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    phone: '+62 812-4455-201',
    branchId: 'b-1',
    departmentId: 'd-2',
    shiftId: 's-1',
    passwordHash: 'argon2id$enterprise$hradmin',
  },
  {
    id: 'u-3',
    employeeCode: 'EMP-0003',
    email: 'manager.eng@enterprise.corp',
    fullName: 'Reza Pratama Kusuma',
    role: 'MANAGER',
    jobTitle: 'Engineering Manager',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+62 813-7788-302',
    branchId: 'b-1',
    departmentId: 'd-1',
    shiftId: 's-1',
    passwordHash: 'argon2id$enterprise$manager',
  },
  {
    id: 'u-4',
    employeeCode: 'EMP-0004',
    email: 'dimas.anggara@enterprise.corp',
    fullName: 'Dimas Anggara',
    role: 'EMPLOYEE',
    jobTitle: 'Senior Cloud Engineer',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    phone: '+62 812-3344-403',
    branchId: 'b-1',
    departmentId: 'd-1',
    shiftId: 's-1',
    passwordHash: 'argon2id$enterprise$employee',
  },
  {
    id: 'u-5',
    employeeCode: 'EMP-0005',
    email: 'nadia.saphira@enterprise.corp',
    fullName: 'Nadia Saphira',
    role: 'EMPLOYEE',
    jobTitle: 'Frontend Architect',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    phone: '+62 815-5566-504',
    branchId: 'b-1',
    departmentId: 'd-1',
    shiftId: 's-1',
    passwordHash: 'argon2id$enterprise$employee',
  },
  {
    id: 'u-6',
    employeeCode: 'EMP-0006',
    email: 'fajar.hidayat@enterprise.corp',
    fullName: 'Fajar Hidayat',
    role: 'EMPLOYEE',
    jobTitle: 'Fullstack Developer',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    phone: '+62 817-6677-605',
    branchId: 'b-2',
    departmentId: 'd-4',
    shiftId: 's-2',
    passwordHash: 'argon2id$enterprise$employee',
  },
  {
    id: 'u-7',
    employeeCode: 'EMP-0007',
    email: 'sitialiyah@enterprise.corp',
    fullName: 'Siti Aliyah Putri',
    role: 'EMPLOYEE',
    jobTitle: 'Product Designer (UI/UX)',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    phone: '+62 818-8899-706',
    branchId: 'b-3',
    departmentId: 'd-5',
    shiftId: 's-4',
    passwordHash: 'argon2id$enterprise$employee',
  },
  {
    id: 'u-8',
    employeeCode: 'EMP-0008',
    email: 'budi.santoso@enterprise.corp',
    fullName: 'Budi Santoso',
    role: 'EMPLOYEE',
    jobTitle: 'Financial Analyst',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    phone: '+62 819-1122-807',
    branchId: 'b-1',
    departmentId: 'd-3',
    shiftId: 's-1',
    passwordHash: 'argon2id$enterprise$employee',
  },
];

async function main() {
  console.log('Seeding Neon PostgreSQL Database...');

  // 1. Branches
  for (const b of BRANCHES) {
    await prisma.branch.upsert({
      where: { id: b.id },
      update: b,
      create: b,
    });
  }
  console.log(`✓ Seeded ${BRANCHES.length} branches`);

  // 2. Departments
  for (const d of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { id: d.id },
      update: d,
      create: d,
    });
  }
  console.log(`✓ Seeded ${DEPARTMENTS.length} departments`);

  // 3. Shifts
  for (const s of SHIFTS) {
    await prisma.shift.upsert({
      where: { id: s.id },
      update: s,
      create: s,
    });
  }
  console.log(`✓ Seeded ${SHIFTS.length} shifts`);

  // 4. Users
  for (const u of USERS) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        employeeCode: u.employeeCode,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        jobTitle: u.jobTitle,
        avatarUrl: u.avatarUrl,
        phone: u.phone,
        branchId: u.branchId,
        departmentId: u.departmentId,
        shiftId: u.shiftId,
      },
      create: u,
    });
  }
  console.log(`✓ Seeded ${USERS.length} enterprise users`);

  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
