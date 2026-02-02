import { NextRequest, NextResponse } from 'next/server';
import { db, systemSettings } from '@/shared/lib/db';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await db.select().from(systemSettings);

    const result = settings.map(s => ({
      id: s.id,
      key: s.key,
      value: s.value,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Settings API error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    // Try to update first
    const existing = await db.select().from(systemSettings).where(eq(systemSettings.key, key));

    if (existing.length > 0) {
      await db.update(systemSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(systemSettings.key, key));
    } else {
      await db.insert(systemSettings).values({ key, value });
    }

    return NextResponse.json({ key, value });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
