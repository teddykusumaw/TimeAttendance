import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const shifts = await prisma.shift.findMany({
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json({
      status: 'success',
      data: shifts,
      meta: {
        total: shifts.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Error fetching shifts:', err);
    return NextResponse.json(
      {
        status: 'error',
        message: err.message || 'Gagal memuat daftar shift',
        data: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      code,
      startTime = '08:00',
      endTime = '17:00',
      gracePeriodMins = 15,
      breakMins = 60,
      isFlexible = false,
      workDays = 'MON,TUE,WED,THU,FRI',
    } = body;

    if (!name) {
      return NextResponse.json(
        { status: 'error', message: 'Nama Shift wajib diisi.' },
        { status: 400 }
      );
    }

    let shiftCode = code?.trim();
    if (!shiftCode) {
      const count = await prisma.shift.count();
      shiftCode = `SH-${startTime.replace(':', '')}-${String(count + 1).padStart(2, '0')}`;
    }

    const newShift = await prisma.shift.create({
      data: {
        code: shiftCode,
        name: name.trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        gracePeriodMins: Number(gracePeriodMins) || 15,
        breakMins: Number(breakMins) || 60,
        isFlexible: Boolean(isFlexible),
        workDays: workDays.trim(),
      },
    });

    return NextResponse.json({
      status: 'success',
      message: `Shift ${newShift.name} (${newShift.code}) berhasil dibuat.`,
      data: newShift,
    });
  } catch (err: any) {
    console.error('Error creating shift in Neon DB:', err);
    return NextResponse.json(
      { status: 'error', message: err.message || 'Gagal membuat shift baru.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      code,
      startTime,
      endTime,
      gracePeriodMins,
      breakMins,
      isFlexible,
      workDays,
    } = body;

    if (!id) {
      return NextResponse.json(
        { status: 'error', message: 'ID Shift wajib disertakan.' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (code !== undefined) updateData.code = String(code).trim();
    if (startTime !== undefined) updateData.startTime = String(startTime).trim();
    if (endTime !== undefined) updateData.endTime = String(endTime).trim();
    if (gracePeriodMins !== undefined) updateData.gracePeriodMins = Number(gracePeriodMins);
    if (breakMins !== undefined) updateData.breakMins = Number(breakMins);
    if (isFlexible !== undefined) updateData.isFlexible = Boolean(isFlexible);
    if (workDays !== undefined) updateData.workDays = String(workDays).trim();

    const updatedShift = await prisma.shift.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      status: 'success',
      message: `Shift ${updatedShift.name} berhasil diperbarui.`,
      data: updatedShift,
    });
  } catch (err: any) {
    console.error('Error updating shift in Neon DB:', err);
    return NextResponse.json(
      { status: 'error', message: err.message || 'Gagal memperbarui shift.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { status: 'error', message: 'Parameter id wajib disertakan.' },
        { status: 400 }
      );
    }

    await prisma.shift.delete({
      where: { id },
    });

    return NextResponse.json({
      status: 'success',
      message: 'Shift berhasil dihapus.',
    });
  } catch (err: any) {
    console.error('Error deleting shift in Neon DB:', err);
    return NextResponse.json(
      { status: 'error', message: err.message || 'Gagal menghapus shift.' },
      { status: 500 }
    );
  }
}
