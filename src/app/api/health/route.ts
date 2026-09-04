import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    system: 'Enterprise Time Attendance Platform',
    version: '1.0.0',
    tier: 'Tier 1 Enterprise',
    database: {
      provider: 'Neon Serverless PostgreSQL',
      poolerStatus: 'ONLINE',
      ssl: 'ENABLED',
      region: 'ap-southeast-1',
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}
