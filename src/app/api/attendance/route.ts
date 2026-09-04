import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INITIAL_ATTENDANCE } from '@/lib/mock-data';
import { AttendanceRecord, AttendanceStatus, VerificationMethod } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeCode = searchParams.get('employeeCode');
  const userId = searchParams.get('userId');
  const dateStr = searchParams.get('date');

  try {
    const whereClause: any = {};
    if (userId) whereClause.userId = userId;
    if (employeeCode) whereClause.user = { employeeCode };
    if (dateStr) whereClause.date = new Date(dateStr);

    const dbRecords = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            role: true,
            department: { select: { name: true } },
          },
        },
        branch: { select: { id: true, name: true } },
        shift: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    if (dbRecords.length > 0) {
      const mappedRecords: AttendanceRecord[] = dbRecords.map((r) => ({
        id: r.id,
        userId: r.userId,
        employeeCode: r.user.employeeCode,
        employeeName: r.user.fullName,
        departmentName: r.user.department?.name || 'Divisi',
        branchName: r.branch.name,
        shiftName: r.shift?.name || 'Standard Shift',
        date: r.date.toISOString().split('T')[0],
        checkIn: r.checkIn ? r.checkIn.toISOString() : undefined,
        checkOut: r.checkOut ? r.checkOut.toISOString() : undefined,
        status: r.status as AttendanceStatus,
        lateMinutes: r.lateMinutes,
        earlyMinutes: r.earlyMinutes,
        overtimeMinutes: r.overtimeMinutes,
        effectiveWorkHours: r.effectiveWorkHours,
        verificationMethod: r.verificationMethod as VerificationMethod,
        photoUrl: r.photoUrl || undefined,
        notes: r.notes || undefined,
        createdAt: r.createdAt.toISOString(),
      }));

      return NextResponse.json({
        status: 'success',
        source: 'database',
        data: mappedRecords,
        meta: {
          total: mappedRecords.length,
          timestamp: new Date().toISOString(),
          database: 'Neon Serverless PostgreSQL',
        },
      });
    }

    // Fallback to initial seed if empty
    return NextResponse.json({
      status: 'success',
      source: 'fallback',
      data: INITIAL_ATTENDANCE,
      meta: {
        total: INITIAL_ATTENDANCE.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Error fetching attendance from database:', err);
    return NextResponse.json({
      status: 'success',
      source: 'fallback_error',
      data: INITIAL_ATTENDANCE,
      error: err.message,
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      employeeCode,
      type, // 'IN' | 'OUT'
      notes,
      photoUrl,
      method = 'FACIAL_RECOG',
      latitude,
      longitude,
    } = body;

    // Resolve user by ID or employeeCode
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(userId ? [{ id: userId }] : []),
          ...(employeeCode ? [{ employeeCode }] : []),
        ],
      },
      include: { branch: true, shift: true, department: true },
    });

    if (!user) {
      return NextResponse.json(
        { status: 'error', message: 'User karyawan tidak ditemukan di database.' },
        { status: 404 }
      );
    }

    const now = new Date();
    const today = new Date(now.toISOString().split('T')[0]);

    if (type === 'IN' || type === 'CHECK_IN') {
      // Determine if late based on shift
      const shiftStartTime = user.shift?.startTime || '08:00';
      const [startH, startM] = shiftStartTime.split(':').map(Number);
      const shiftStart = new Date(now);
      shiftStart.setHours(startH, startM + (user.shift?.gracePeriodMins || 15), 0, 0);

      const isLate = now > shiftStart;
      const lateMins = isLate ? Math.round((now.getTime() - shiftStart.getTime()) / 60000) : 0;
      const status: AttendanceStatus = isLate ? 'LATE' : 'PRESENT';

      const record = await prisma.attendanceRecord.upsert({
        where: {
          userId_date: {
            userId: user.id,
            date: today,
          },
        },
        update: {
          checkIn: now,
          status,
          lateMinutes: lateMins,
          verificationMethod: method as any,
          photoUrl: photoUrl || undefined,
          latitude: latitude || undefined,
          longitude: longitude || undefined,
          notes: notes || undefined,
        },
        create: {
          userId: user.id,
          branchId: user.branchId,
          shiftId: user.shiftId,
          date: today,
          checkIn: now,
          status,
          lateMinutes: lateMins,
          verificationMethod: method as any,
          photoUrl: photoUrl || undefined,
          latitude: latitude || undefined,
          longitude: longitude || undefined,
          notes: notes || undefined,
        },
      });

      // Log to database AuditLog
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'CHECK_IN',
          entityType: 'AttendanceRecord',
          entityId: record.id,
          details: `Check-In Berhasil via ${method} (Status: ${status}, Skor/Catatan: ${notes || '-'})`,
        },
      });

      return NextResponse.json({
        status: 'success',
        message: `Presensi Masuk untuk ${user.fullName} berhasil disimpan permanen ke Neon PostgreSQL.`,
        data: record,
      });
    } else if (type === 'OUT' || type === 'CHECK_OUT') {
      const existing = await prisma.attendanceRecord.findUnique({
        where: {
          userId_date: {
            userId: user.id,
            date: today,
          },
        },
      });

      if (!existing || !existing.checkIn) {
        return NextResponse.json(
          { status: 'error', message: 'Anda belum melakukan Check-In hari ini di database.' },
          { status: 400 }
        );
      }

      const checkInTime = new Date(existing.checkIn);
      const totalMins = Math.max(0, Math.round((now.getTime() - checkInTime.getTime()) / 60000));
      const effectiveHours = Number((totalMins / 60).toFixed(2));

      const updated = await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: {
          checkOut: now,
          effectiveWorkHours: effectiveHours,
          photoUrl: photoUrl || existing.photoUrl,
          notes: notes ? `${existing.notes || ''} | ${notes}` : existing.notes,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'CHECK_OUT',
          entityType: 'AttendanceRecord',
          entityId: updated.id,
          details: `Check-Out Berhasil (Total Kerja: ${effectiveHours} Jam)`,
        },
      });

      return NextResponse.json({
        status: 'success',
        message: `Presensi Pulang untuk ${user.fullName} berhasil disimpan permanen ke Neon PostgreSQL.`,
        data: updated,
      });
    }

    return NextResponse.json(
      { status: 'error', message: 'Tipe presensi tidak valid (gunakan IN atau OUT).' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error saving attendance to database:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Gagal menyimpan presensi ke database.' },
      { status: 500 }
    );
  }
}
