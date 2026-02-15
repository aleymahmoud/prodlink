import { NextRequest, NextResponse } from 'next/server';
import { db, profiles } from '@/shared/lib/db';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, id))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Users can only update their own profile
    if (session.user.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { full_name } = body;

    if (!full_name || typeof full_name !== 'string') {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    const [updated] = await db
      .update(profiles)
      .set({
        fullName: full_name.trim(),
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
