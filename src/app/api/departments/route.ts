import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        branch: { select: { id: true, name: true, city: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      status: 'success',
      data: departments,
      meta: {
        total: departments.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Error fetching departments:', err);
    return NextResponse.json(
      {
        status: 'error',
        message: err.message || 'Gagal memuat daftar departemen',
        data: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, branchId } = body;

    if (!name) {
      return NextResponse.json(
        { status: 'error', message: 'Nama Departemen wajib diisi.' },
        { status: 400 }
      );
    }

    let deptCode = code?.trim();
    if (!deptCode) {
      const count = await prisma.department.count();
      deptCode = `DEP-${name.slice(0, 3).toUpperCase()}-${String(count + 1).padStart(2, '0')}`;
    }

    const newDept = await prisma.department.create({
      data: {
        code: deptCode,
        name: name.trim(),
        branchId: branchId || null,
      },
      include: {
        branch: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      status: 'success',
      message: `Departemen ${newDept.name} (${newDept.code}) berhasil dibuat.`,
      data: newDept,
    });
  } catch (err: any) {
    console.error('Error creating department in Neon DB:', err);
    return NextResponse.json(
      { status: 'error', message: err.message || 'Gagal membuat departemen baru.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, code, branchId } = body;

    if (!id) {
      return NextResponse.json(
        { status: 'error', message: 'ID Departemen wajib disertakan.' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (code !== undefined) updateData.code = String(code).trim();
    if (branchId !== undefined) updateData.branchId = branchId || null;

    const updatedDept = await prisma.department.update({
      where: { id },
      data: updateData,
      include: {
        branch: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      status: 'success',
      message: `Departemen ${updatedDept.name} berhasil diperbarui.`,
      data: updatedDept,
    });
  } catch (err: any) {
    console.error('Error updating department in Neon DB:', err);
    return NextResponse.json(
      { status: 'error', message: err.message || 'Gagal memperbarui departemen.' },
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

    await prisma.department.delete({
      where: { id },
    });

    return NextResponse.json({
      status: 'success',
      message: 'Departemen berhasil dihapus.',
    });
  } catch (err: any) {
    console.error('Error deleting department in Neon DB:', err);
    return NextResponse.json(
      { status: 'error', message: err.message || 'Gagal menghapus departemen.' },
      { status: 500 }
    );
  }
}
