import { NextResponse } from 'next/server';
import { INITIAL_ATTENDANCE } from '@/lib/mock-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeCode = searchParams.get('employeeCode');
  const date = searchParams.get('date');

  let records = [...INITIAL_ATTENDANCE];

  if (employeeCode) {
    records = records.filter((r) => r.employeeCode.toLowerCase() === employeeCode.toLowerCase());
  }

  if (date) {
    records = records.filter((r) => r.date === date);
  }

  return NextResponse.json({
    status: 'success',
    data: records,
    meta: {
      total: records.length,
      timestamp: new Date().toISOString(),
      tier: 'Enterprise Tier 1',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeCode, type, timestamp, notes, location } = body;

    if (!employeeCode || !type) {
      return NextResponse.json(
        { status: 'error', message: 'Parameter employeeCode dan type wajib disertakan.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: `Presensi ${type} untuk karyawan ${employeeCode} berhasil dicatat.`,
      transactionId: `tx-${Date.now()}`,
      recordedAt: timestamp || new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Payload JSON tidak valid.' },
      { status: 400 }
    );
  }
}
