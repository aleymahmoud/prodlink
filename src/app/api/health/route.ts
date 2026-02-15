import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, string> = {};

  // Check env vars
  checks.DATABASE_URL = process.env.DATABASE_URL ? 'set' : 'MISSING';
  checks.AUTH_SECRET = process.env.AUTH_SECRET ? 'set' : 'MISSING';
  checks.AUTH_URL = process.env.AUTH_URL ? process.env.AUTH_URL : 'MISSING';
  checks.NODE_ENV = process.env.NODE_ENV || 'unknown';

  // Check DB connection
  try {
    const { db } = await import('@/shared/lib/db');
    const { sql } = await import('drizzle-orm');
    const result = await db.execute(sql`SELECT 1 as ok`);
    checks.database = 'connected';
  } catch (e: any) {
    checks.database = `ERROR: ${e.message}`;
  }

  const allOk = !Object.values(checks).some(v => v.startsWith('ERROR') || v === 'MISSING');

  return NextResponse.json({
    status: allOk ? 'healthy' : 'unhealthy',
    checks,
  }, { status: allOk ? 200 : 500 });
}
