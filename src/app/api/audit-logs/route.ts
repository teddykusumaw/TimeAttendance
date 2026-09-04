import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLog, Role } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const actorId = searchParams.get('actorId');
    const take = Number(searchParams.get('take') || 100);

    const where: any = {};
    if (action && action !== 'ALL') where.action = action;
    if (actorId) where.actorId = actorId;

    const dbLogs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            role: true,
            employeeCode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    const mappedLogs: AuditLog[] = dbLogs.map((log) => ({
      id: log.id,
      actorId: log.actorId,
      actorName: log.actor?.fullName || 'Super Administrator',
      actorRole: (log.actor?.role as Role) || 'SUPER_ADMIN',
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details,
      ipAddress: log.ipAddress || '127.0.0.1 (Secure TLS)',
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({
      status: 'success',
      source: 'database',
      data: mappedLogs,
      meta: {
        total: mappedLogs.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Error fetching audit logs:', err);
    return NextResponse.json(
      {
        status: 'error',
        message: err.message || 'Gagal memuat log audit dari database.',
        data: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { actorId, action, entityType, entityId, details, ipAddress } = body;

    if (!actorId || !action || !entityType) {
      return NextResponse.json(
        { status: 'error', message: 'actorId, action, dan entityType wajib disertakan.' },
        { status: 400 }
      );
    }

    const newLog = await prisma.auditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId: entityId || null,
        details: typeof details === 'object' ? JSON.stringify(details) : details || null,
        ipAddress: ipAddress || null,
      },
      include: {
        actor: {
          select: { fullName: true, role: true },
        },
      },
    });

    return NextResponse.json({
      status: 'success',
      data: {
        id: newLog.id,
        actorId: newLog.actorId,
        actorName: newLog.actor?.fullName || 'User',
        actorRole: (newLog.actor?.role as Role) || 'EMPLOYEE',
        action: newLog.action,
        entityType: newLog.entityType,
        entityId: newLog.entityId,
        details: newLog.details,
        ipAddress: newLog.ipAddress,
        createdAt: newLog.createdAt.toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Error creating audit log:', err);
    return NextResponse.json(
      { status: 'error', message: err.message || 'Gagal menyimpan log audit.' },
      { status: 500 }
    );
  }
}
