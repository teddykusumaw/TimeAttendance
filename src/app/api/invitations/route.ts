import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

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
          branchName: invitation.branch?.name,
          departmentId: invitation.departmentId,
          departmentName: invitation.department?.name,
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
      branchName: inv.branch?.name,
      departmentId: inv.departmentId,
      departmentName: inv.department?.name,
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

    if (!email || !fullName) {
      return NextResponse.json(
        { status: 'error', message: 'Email dan Nama Lengkap calon karyawan wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists in DB
    let userRecord = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    // If user does not exist in database, automatically create user record as requested!
    if (!userRecord) {
      const totalUsers = await prisma.user.count();
      let finalEmployeeCode = `EMP-${String(totalUsers + 1).padStart(4, '0')}`;
      let existingCode = await prisma.user.findUnique({ where: { employeeCode: finalEmployeeCode } });
      let counter = totalUsers + 1;
      while (existingCode) {
        counter++;
        finalEmployeeCode = `EMP-${String(counter).padStart(4, '0')}`;
        existingCode = await prisma.user.findUnique({ where: { employeeCode: finalEmployeeCode } });
      }

      const salt = bcrypt.genSaltSync(10);
      const initialPasswordHash = bcrypt.hashSync('12345678!', salt);

      userRecord = await prisma.user.create({
        data: {
          employeeCode: finalEmployeeCode,
          email: cleanEmail,
          fullName: fullName.trim(),
          role: role || 'EMPLOYEE',
          jobTitle: jobTitle?.trim() || 'Staff Karyawan',
          phone: phone?.trim() || null,
          passwordHash: initialPasswordHash,
          branchId: branchId || null,
          departmentId: departmentId || null,
          shiftId: shiftId || null,
          avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          isActive: true,
        },
      });
    }

    // Check if there is already a pending invitation for this email
    const existingInv = await prisma.invitation.findFirst({
      where: {
        email: cleanEmail,
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
        email: cleanEmail,
        fullName: fullName.trim(),
        role: role || 'EMPLOYEE',
        jobTitle: jobTitle?.trim() || 'Staff Karyawan',
        phone: phone?.trim() || null,
        branchId: branchId || null,
        departmentId: departmentId || null,
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
        actorId: invitedBy || userRecord.id,
        action: 'INVITATION_CREATED',
        entityType: 'Invitation',
        entityId: newInvitation.id,
        details: `Undangan onboarding karyawan dibuat untuk: ${fullName} (${cleanEmail}) sebagai ${jobTitle || 'Staff Karyawan'}`,
      },
    });

    return NextResponse.json({
      status: 'success',
      message: `Undangan untuk ${fullName} berhasil dibuat dan data user otomatis terdaftar di database.`,
      data: {
        ...newInvitation,
        branchName: newInvitation.branch?.name,
        departmentName: newInvitation.department?.name,
        shiftName: newInvitation.shift?.name,
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

      const finalName = fullName?.trim() || inv.fullName;
      const finalPhone = phone?.trim() || inv.phone;

      // Find or create User in Neon PostgreSQL
      let activeUser = await prisma.user.findUnique({
        where: { email: inv.email },
        include: { branch: true, department: true, shift: true },
      });

      if (activeUser) {
        activeUser = await prisma.user.update({
          where: { id: activeUser.id },
          data: {
            fullName: finalName,
            phone: finalPhone || activeUser.phone,
            employeeCode: customEmployeeCode?.trim() || activeUser.employeeCode,
            branchId: inv.branchId || activeUser.branchId,
            departmentId: inv.departmentId || activeUser.departmentId,
            shiftId: inv.shiftId || activeUser.shiftId,
            isActive: true,
          },
          include: { branch: true, department: true, shift: true },
        });
      } else {
        const totalUsers = await prisma.user.count();
        let finalEmployeeCode = customEmployeeCode?.trim() || `EMP-${String(totalUsers + 1).padStart(4, '0')}`;
        let existingCode = await prisma.user.findUnique({ where: { employeeCode: finalEmployeeCode } });
        let counter = totalUsers + 1;
        while (existingCode) {
          counter++;
          finalEmployeeCode = `EMP-${String(counter).padStart(4, '0')}`;
          existingCode = await prisma.user.findUnique({ where: { employeeCode: finalEmployeeCode } });
        }

        const salt = bcrypt.genSaltSync(10);
        const initialPasswordHash = bcrypt.hashSync('12345678!', salt);

        activeUser = await prisma.user.create({
          data: {
            employeeCode: finalEmployeeCode,
            email: inv.email,
            fullName: finalName,
            passwordHash: initialPasswordHash,
            role: inv.role,
            jobTitle: inv.jobTitle || 'Staff Karyawan',
            phone: finalPhone,
            branchId: inv.branchId || null,
            departmentId: inv.departmentId || null,
            shiftId: inv.shiftId || null,
            avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
            isActive: true,
          },
          include: { branch: true, department: true, shift: true },
        });
      }

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
          actorId: activeUser.id,
          action: 'INVITATION_ACCEPTED',
          entityType: 'User',
          entityId: activeUser.id,
          details: `Undangan onboard berhasil diterima oleh: ${activeUser.fullName} (${activeUser.employeeCode}) via token ${token.slice(0, 10)}...`,
        },
      });

      const mappedUser = {
        id: activeUser.id,
        employeeCode: activeUser.employeeCode,
        email: activeUser.email,
        fullName: activeUser.fullName,
        role: activeUser.role,
        jobTitle: activeUser.jobTitle,
        avatarUrl: activeUser.avatarUrl,
        phone: activeUser.phone,
        isActive: activeUser.isActive,
        branchId: activeUser.branchId,
        branchName: activeUser.branch?.name,
        departmentId: activeUser.departmentId,
        departmentName: activeUser.department?.name,
        shiftId: activeUser.shiftId,
        shiftName: activeUser.shift?.name,
      };

      return NextResponse.json({
        status: 'success',
        message: `Selamat bergabung, ${activeUser.fullName}! Akun Anda telah berhasil diaktivasi.`,
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
