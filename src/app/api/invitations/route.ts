import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  try {
    if (token) {
      const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: {
          branch: { select: { id: true, name: true, city: true } },
          department: { select: { id: true, name: true } },
          shift: { select: { id: true, name: true, startTime: true, endTime: true } },
        },
      });

      if (!invitation) {
        return NextResponse.json(
          { status: 'error', message: 'Tautan undangan tidak valid atau tidak ditemukan.' },
          { status: 404 }
        );
      }

      const isExpired = new Date() > new Date(invitation.expiresAt);
      if (isExpired && invitation.status === 'PENDING') {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Tautan undangan telah kedaluwarsa (berlaku maksimal 7 hari). Silakan hubungi HR.',
            data: { ...invitation, status: 'EXPIRED' },
          },
          { status: 410 }
        );
      }

      return NextResponse.json({
        status: 'success',
        data: {
          id: invitation.id,
          token: invitation.token,
          email: invitation.email,
          fullName: invitation.fullName,
          role: invitation.role,
          jobTitle: invitation.jobTitle,
          phone: invitation.phone,
          branchId: invitation.branchId,
          branchName: invitation.branch.name,
          departmentId: invitation.departmentId,
          departmentName: invitation.department.name,
          shiftId: invitation.shiftId,
          shiftName: invitation.shift?.name,
          status: invitation.status,
          invitedByName: invitation.invitedByName,
          expiresAt: invitation.expiresAt.toISOString(),
          createdAt: invitation.createdAt.toISOString(),
        },
      });
    }

    // Fetch all invitations for HR Admin
    const allInvitations = await prisma.invitation.findMany({
      include: {
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        shift: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = allInvitations.map((inv) => ({
      id: inv.id,
      token: inv.token,
      email: inv.email,
      fullName: inv.fullName,
      role: inv.role,
      jobTitle: inv.jobTitle,
      phone: inv.phone,
      branchId: inv.branchId,
      branchName: inv.branch.name,
      departmentId: inv.departmentId,
      departmentName: inv.department.name,
      shiftId: inv.shiftId,
      shiftName: inv.shift?.name,
      status: inv.status,
      invitedBy: inv.invitedBy,
      invitedByName: inv.invitedByName,
      expiresAt: inv.expiresAt.toISOString(),
      acceptedAt: inv.acceptedAt ? inv.acceptedAt.toISOString() : null,
      createdAt: inv.createdAt.toISOString(),
    }));

    return NextResponse.json({
      status: 'success',
      data: mapped,
    });
  } catch (err: any) {
    console.error('Error fetching invitations:', err);
    return NextResponse.json(
      { status: 'error', message: err.message || 'Gagal memuat data undangan.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      fullName,
      role = 'EMPLOYEE',
      jobTitle,
      phone,
      branchId,
      departmentId,
      shiftId,
      invitedBy,
      invitedByName,
    } = body;

    if (!email || !fullName || !branchId || !departmentId) {
      return NextResponse.json(
        { status: 'error', message: 'Email, Nama Lengkap, Cabang, dan Departemen wajib diisi.' },
        { status: 400 }
      );
    }

    // Check if user already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { status: 'error', message: `Pengguna dengan email "${email}" sudah aktif terdaftar.` },
        { status: 409 }
      );
    }

    // Check if there is already a pending invitation for this email
    const existingInv = await prisma.invitation.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInv) {
      return NextResponse.json(
        {
          status: 'success',
          message: 'Undangan aktif sudah ada untuk email ini. Link undangan siap disalin.',
          data: existingInv,
        },
        { status: 200 }
      );
    }

    // Generate secure token
    const randomHex = crypto.randomBytes(16).toString('hex');
    const token = `inv-${randomHex}`;

    // Expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const newInvitation = await prisma.invitation.create({
      data: {
        token,
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        role: role || 'EMPLOYEE',
        jobTitle: jobTitle?.trim() || 'Staff Karyawan',
        phone: phone?.trim() || null,
        branchId,
        departmentId,
        shiftId: shiftId || null,
        status: 'PENDING',
        invitedBy: invitedBy || 'system-hr',
        invitedByName: invitedByName || 'HR Operations',
        expiresAt,
      },
      include: {
        branch: true,
        department: true,
        shift: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: invitedBy || 'system-hr',
        action: 'INVITATION_CREATED',
        entityType: 'Invitation',
        entityId: newInvitation.id,
        details: `Undangan onboarding karyawan dibuat untuk: ${fullName} (${email}) sebagai ${jobTitle}`,
      },
    });

    return NextResponse.json({
      status: 'success',
      message: `Undangan untuk ${fullName} berhasil dibuat.`,
      data: {
        ...newInvitation,
        expiresAt: newInvitation.expiresAt.toISOString(),
        createdAt: newInvitation.createdAt.toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Error creating invitation:', err);
    return NextResponse.json(
      { status: 'error', message: err.message || 'Gagal membuat undangan karyawan.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action, token, invitationId, fullName, phone, customEmployeeCode } = body;

    if (action === 'ACCEPT') {
      if (!token) {
        return NextResponse.json(
          { status: 'error', message: 'Token undangan wajib disertakan.' },
          { status: 400 }
        );
      }

      const inv = await prisma.invitation.findUnique({
        where: { token },
        include: { branch: true, department: true, shift: true },
      });

      if (!inv) {
        return NextResponse.json(
          { status: 'error', message: 'Undangan tidak ditemukan.' },
          { status: 404 }
        );
      }

      if (inv.status !== 'PENDING') {
        return NextResponse.json(
          { status: 'error', message: `Undangan sudah ${inv.status === 'ACCEPTED' ? 'diterima sebelumnya' : 'tidak aktif'}.` },
          { status: 400 }
        );
      }

      if (new Date() > new Date(inv.expiresAt)) {
        await prisma.invitation.update({
          where: { token },
          data: { status: 'EXPIRED' },
        });
        return NextResponse.json(
          { status: 'error', message: 'Undangan telah kedaluwarsa.' },
          { status: 410 }
        );
      }

      // Generate next available EMP-XXXX code if not provided
      let finalEmployeeCode = customEmployeeCode?.trim();
      if (!finalEmployeeCode) {
        const totalUsers = await prisma.user.count();
        finalEmployeeCode = `EMP-${String(totalUsers + 1).padStart(4, '0')}`;
        // Ensure uniqueness
        let existingUserWithCode = await prisma.user.findUnique({ where: { employeeCode: finalEmployeeCode } });
        let counter = totalUsers + 1;
        while (existingUserWithCode) {
          counter++;
          finalEmployeeCode = `EMP-${String(counter).padStart(4, '0')}`;
          existingUserWithCode = await prisma.user.findUnique({ where: { employeeCode: finalEmployeeCode } });
        }
      }

      const finalName = fullName?.trim() || inv.fullName;
      const finalPhone = phone?.trim() || inv.phone;

      // Create new active User in Neon PostgreSQL
      const newUser = await prisma.user.create({
        data: {
          employeeCode: finalEmployeeCode,
          email: inv.email,
          fullName: finalName,
          passwordHash: 'argon2_default_hash',
          role: inv.role,
          jobTitle: inv.jobTitle,
          phone: finalPhone,
          branchId: inv.branchId,
          departmentId: inv.departmentId,
          shiftId: inv.shiftId,
          avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          isActive: true,
        },
        include: {
          branch: true,
          department: true,
          shift: true,
        },
      });

      // Mark invitation as ACCEPTED
      await prisma.invitation.update({
        where: { token },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          actorId: newUser.id,
          action: 'INVITATION_ACCEPTED',
          entityType: 'User',
          entityId: newUser.id,
          details: `Undangan onboard berhasil diterima oleh: ${newUser.fullName} (${newUser.employeeCode}) via token ${token.slice(0, 10)}...`,
        },
      });

      const mappedUser = {
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
      };

      return NextResponse.json({
        status: 'success',
        message: `Selamat bergabung, ${newUser.fullName}! Akun Anda telah berhasil diaktivasi.`,
        data: mappedUser,
      });
    } else if (action === 'REVOKE') {
      const targetId = invitationId;
      if (!targetId) {
        return NextResponse.json(
          { status: 'error', message: 'invitationId wajib disertakan.' },
          { status: 400 }
        );
      }

      const revoked = await prisma.invitation.update({
        where: { id: targetId },
        data: { status: 'REVOKED' },
      });

      return NextResponse.json({
        status: 'success',
        message: `Undangan untuk ${revoked.email} berhasil dibatalkan.`,
        data: revoked,
      });
    }

    return NextResponse.json({ status: 'error', message: 'Aksi tidak dikenal.' }, { status: 400 });
  } catch (err: any) {
    console.error('Error handling invitation action:', err);
    return NextResponse.json(
      { status: 'error', message: err.message || 'Gagal memproses aksi undangan.' },
      { status: 500 }
    );
  }
}
