import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INITIAL_USERS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const dbUsers = await prisma.user.findMany({
      include: {
        branch: { select: { id: true, name: true, city: true } },
        department: { select: { id: true, name: true } },
        shift: { select: { id: true, name: true } },
      },
      orderBy: { employeeCode: 'asc' },
    });

    if (dbUsers.length > 0) {
      const mapped = dbUsers.map((u) => ({
        id: u.id,
        employeeCode: u.employeeCode,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        jobTitle: u.jobTitle,
        avatarUrl: u.avatarUrl,
        phone: u.phone,
        isActive: u.isActive,
        branchId: u.branchId,
        branchName: u.branch.name,
        departmentId: u.departmentId,
        departmentName: u.department.name,
        shiftId: u.shiftId,
        shiftName: u.shift?.name || undefined,
        boundDeviceId: u.boundDeviceId || undefined,
        boundDeviceName: u.boundDeviceName || undefined,
        boundDeviceAt: u.boundDeviceAt ? u.boundDeviceAt.toISOString() : undefined,
        facePhotoUrl: u.facePhotoUrl || undefined,
        faceEnrolledAt: u.faceEnrolledAt ? u.faceEnrolledAt.toISOString() : undefined,
      }));

      return NextResponse.json({
        status: 'success',
        source: 'database',
        data: mapped,
      });
    }

    return NextResponse.json({
      status: 'success',
      source: 'fallback',
      data: INITIAL_USERS,
    });
  } catch (err: any) {
    console.error('Error fetching users from database:', err);
    return NextResponse.json({
      status: 'success',
      source: 'fallback_error',
      data: INITIAL_USERS,
      error: err.message,
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action, userId, deviceId, deviceName, facePhotoUrl, actor } = body;

    if (!userId) {
      return NextResponse.json(
        { status: 'error', message: 'userId wajib disertakan.' },
        { status: 400 }
      );
    }

    if (action === 'BIND_DEVICE') {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          boundDeviceId: deviceId,
          boundDeviceName: deviceName,
          boundDeviceAt: new Date(),
        },
        include: { branch: true, department: true, shift: true },
      });

      await prisma.auditLog.create({
        data: {
          actorId: userId,
          action: 'DEVICE_BIND',
          entityType: 'User',
          entityId: userId,
          details: `Binding Perangkat HP Berhasil: ${deviceName} (ID: ${deviceId.slice(0, 10)}...)`,
        },
      });

      return NextResponse.json({
        status: 'success',
        message: `Perangkat ${deviceName} berhasil diikatkan secara permanen di Neon PostgreSQL.`,
        data: updated,
      });
    } else if (action === 'RESET_DEVICE') {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const prevDevice = user?.boundDeviceName || 'Unknown Device';

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          boundDeviceId: null,
          boundDeviceName: null,
          boundDeviceAt: null,
        },
        include: { branch: true, department: true, shift: true },
      });

      await prisma.auditLog.create({
        data: {
          actorId: actor?.id || userId,
          action: 'DEVICE_UNBIND',
          entityType: 'User',
          entityId: userId,
          details: `Reset Binding HP untuk ${updated.fullName} oleh ${actor?.name || 'Super Admin'}. Perangkat (${prevDevice}) dilepas.`,
        },
      });

      return NextResponse.json({
        status: 'success',
        message: `Binding HP untuk ${updated.fullName} berhasil di-reset di Neon PostgreSQL.`,
        data: updated,
      });
    } else if (action === 'ENROLL_FACE') {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          facePhotoUrl: facePhotoUrl,
          faceEnrolledAt: new Date(),
        },
        include: { branch: true, department: true, shift: true },
      });

      await prisma.auditLog.create({
        data: {
          actorId: userId,
          action: 'ENROLL_FACE',
          entityType: 'User',
          entityId: userId,
          details: `Perekaman Master Biometrik Wajah Tersimpan di Database untuk ${updated.fullName}`,
        },
      });

      return NextResponse.json({
        status: 'success',
        message: `Wajah master biometrik untuk ${updated.fullName} berhasil disimpan permanen di Neon PostgreSQL.`,
        data: updated,
      });
    }

    return NextResponse.json(
      { status: 'error', message: 'Aksi PATCH tidak dikenal.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error updating user in database:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Gagal memperbarui user di database.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      employeeCode,
      email,
      fullName,
      role = 'EMPLOYEE',
      jobTitle,
      phone,
      branchId,
      departmentId,
      shiftId,
      avatarUrl,
      actor,
    } = body;

    if (!employeeCode || !email || !fullName || !branchId || !departmentId) {
      return NextResponse.json(
        { status: 'error', message: 'Kolom NIK, email, nama lengkap, cabang, dan departemen wajib diisi.' },
        { status: 400 }
      );
    }

    // Check duplicate employeeCode or email
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { employeeCode: employeeCode.trim() },
          { email: email.trim().toLowerCase() },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          status: 'error',
          message:
            existing.employeeCode === employeeCode.trim()
              ? `NIK / Kode Karyawan "${employeeCode}" sudah terdaftar.`
              : `Email "${email}" sudah digunakan oleh karyawan lain.`,
        },
        { status: 409 }
      );
    }

    const defaultAvatar =
      avatarUrl ||
      `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`;

    const newUser = await prisma.user.create({
      data: {
        employeeCode: employeeCode.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: 'argon2_default_hash',
        fullName: fullName.trim(),
        role: role || 'EMPLOYEE',
        jobTitle: jobTitle?.trim() || 'Staff Karyawan',
        avatarUrl: defaultAvatar,
        phone: phone?.trim() || null,
        isActive: true,
        branchId,
        departmentId,
        shiftId: shiftId || null,
      },
      include: {
        branch: { select: { id: true, name: true, city: true } },
        department: { select: { id: true, name: true } },
        shift: { select: { id: true, name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: actor?.id || newUser.id,
        action: 'CREATE_USER',
        entityType: 'User',
        entityId: newUser.id,
        details: `Penambahan Karyawan Baru Manual: ${newUser.fullName} (${newUser.employeeCode}) sebagai ${newUser.jobTitle}`,
      },
    });

    const mapped = {
      id: newUser.id,
      employeeCode: newUser.employeeCode,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      jobTitle: newUser.jobTitle,
      avatarUrl: newUser.avatarUrl,
      phone: newUser.phone,
      isActive: newUser.isActive,
      branchId: newUser.branchId,
      branchName: newUser.branch.name,
      departmentId: newUser.departmentId,
      departmentName: newUser.department.name,
      shiftId: newUser.shiftId,
      shiftName: newUser.shift?.name || undefined,
      boundDeviceId: newUser.boundDeviceId || undefined,
      boundDeviceName: newUser.boundDeviceName || undefined,
      facePhotoUrl: newUser.facePhotoUrl || undefined,
    };

    return NextResponse.json({
      status: 'success',
      message: `Karyawan ${newUser.fullName} (${newUser.employeeCode}) berhasil ditambahkan ke database.`,
      data: mapped,
    });
  } catch (err: any) {
    console.error('Error creating user in database:', err);
    return NextResponse.json(
      { status: 'error', message: err.message || 'Gagal menambahkan karyawan ke database.' },
      { status: 500 }
    );
  }
}
