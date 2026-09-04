import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { status: 'error', message: 'Email/NIK dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanId = String(identifier).trim();

    // Query User from Neon PostgreSQL
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanId, mode: 'insensitive' } },
          { employeeCode: { equals: cleanId, mode: 'insensitive' } },
        ],
      },
      include: {
        branch: { select: { id: true, name: true, city: true } },
        department: { select: { id: true, name: true } },
        shift: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { status: 'error', message: 'Akun dengan Email atau NIK tersebut tidak terdaftar.' },
        { status: 401 }
      );
    }

    // Password verification using Bcrypt
    let passwordValid = false;
    if (
      user.passwordHash.startsWith('$2a$') ||
      user.passwordHash.startsWith('$2b$') ||
      user.passwordHash.startsWith('$2y$')
    ) {
      passwordValid = await bcrypt.compare(password, user.passwordHash);
    } else {
      // Fallback for legacy plain text passwords if any
      passwordValid = password === user.passwordHash;
    }

    if (!passwordValid) {
      return NextResponse.json(
        { status: 'error', message: 'Kata sandi yang Anda masukkan salah.' },
        { status: 401 }
      );
    }

    // Map user for client state
    const mappedUser = {
      id: user.id,
      employeeCode: user.employeeCode,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      jobTitle: user.jobTitle,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      isActive: user.isActive,
      branchId: user.branchId,
      branchName: user.branch?.name || undefined,
      departmentId: user.departmentId,
      departmentName: user.department?.name || undefined,
      shiftId: user.shiftId,
      shiftName: user.shift?.name || undefined,
      boundDeviceId: user.boundDeviceId || undefined,
      boundDeviceName: user.boundDeviceName || undefined,
      boundDeviceAt: user.boundDeviceAt ? user.boundDeviceAt.toISOString() : undefined,
      facePhotoUrl: user.facePhotoUrl || undefined,
      faceEnrolledAt: user.faceEnrolledAt ? user.faceEnrolledAt.toISOString() : undefined,
    };

    // Log login audit
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        details: `Login berhasil: ${user.fullName} (${user.role})`,
      },
    }).catch(() => {});

    return NextResponse.json({
      status: 'success',
      message: 'Autentikasi berhasil.',
      data: mappedUser,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Terjadi kesalahan sistem saat proses login.' },
      { status: 500 }
    );
  }
}
