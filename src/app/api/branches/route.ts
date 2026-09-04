import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({
      status: 'success',
      data: branches,
      meta: {
        total: branches.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Error fetching branches:', err);
    return NextResponse.json(
      {
        status: 'error',
        message: err.message || 'Failed to fetch branches',
        data: [],
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { branchId, id, latitude, longitude, radiusMeters, name, timezone, city } = body;

    const targetId = branchId || id;
    if (!targetId) {
      return NextResponse.json(
        { status: 'error', message: 'Target branchId or id is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (latitude !== undefined) updateData.latitude = Number(latitude);
    if (longitude !== undefined) updateData.longitude = Number(longitude);
    if (radiusMeters !== undefined) updateData.radiusMeters = Number(radiusMeters);
    if (name !== undefined) updateData.name = String(name);
    if (timezone !== undefined) updateData.timezone = String(timezone);
    if (city !== undefined) updateData.city = String(city);

    const updatedBranch = await prisma.branch.update({
      where: { id: targetId },
      data: updateData,
    });

    return NextResponse.json({
      status: 'success',
      message: 'Branch configuration updated successfully in Neon PostgreSQL',
      data: updatedBranch,
    });
  } catch (err: any) {
    console.error('Error updating branch in Neon DB:', err);
    return NextResponse.json(
      {
        status: 'error',
        message: err.message || 'Failed to update branch',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, city, timezone = 'Asia/Jakarta', latitude, longitude, radiusMeters = 200 } = body;

    if (!name || !city) {
      return NextResponse.json(
        { status: 'error', message: 'Nama Cabang dan Kota wajib diisi.' },
        { status: 400 }
      );
    }

    let branchCode = code?.trim();
    if (!branchCode) {
      const count = await prisma.branch.count();
      branchCode = `BR-${city.slice(0, 3).toUpperCase()}-${String(count + 1).padStart(2, '0')}`;
    }

    const newBranch = await prisma.branch.create({
      data: {
        code: branchCode,
        name: name.trim(),
        city: city.trim(),
        timezone,
        latitude: latitude !== undefined ? Number(latitude) : null,
        longitude: longitude !== undefined ? Number(longitude) : null,
        radiusMeters: radiusMeters !== undefined ? Number(radiusMeters) : 200,
      },
    });

    return NextResponse.json({
      status: 'success',
      message: `Cabang ${newBranch.name} (${newBranch.code}) berhasil dibuat.`,
      data: newBranch,
    });
  } catch (err: any) {
    console.error('Error creating branch in Neon DB:', err);
    return NextResponse.json(
      { status: 'error', message: err.message || 'Gagal membuat cabang baru.' },
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

    await prisma.branch.delete({
      where: { id },
    });

    return NextResponse.json({
      status: 'success',
      message: 'Cabang berhasil dihapus.',
    });
  } catch (err: any) {
    console.error('Error deleting branch in Neon DB:', err);
    return NextResponse.json(
      { status: 'error', message: err.message || 'Gagal menghapus cabang.' },
      { status: 500 }
    );
  }
}
