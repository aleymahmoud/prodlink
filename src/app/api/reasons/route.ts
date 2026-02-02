import { NextRequest, NextResponse } from 'next/server';
import { db, reasons } from '@/shared/lib/db';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let query = db.select().from(reasons);

    if (type) {
      const allReasons = await db
        .select()
        .from(reasons)
        .where(eq(reasons.type, type as 'waste' | 'damage' | 'reprocessing'))
        .orderBy(desc(reasons.createdAt));

      const result = allReasons.map(reason => ({
        ...reason,
        name_ar: reason.nameAr,
        is_active: reason.isActive,
        created_at: reason.createdAt?.toISOString(),
        updated_at: reason.updatedAt?.toISOString(),
      }));

      return NextResponse.json(result);
    }

    const allReasons = await db
      .select()
      .from(reasons)
      .orderBy(desc(reasons.createdAt));

    const result = allReasons.map(reason => ({
      ...reason,
      name_ar: reason.nameAr,
      is_active: reason.isActive,
      created_at: reason.createdAt?.toISOString(),
      updated_at: reason.updatedAt?.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Reasons API error:', error);
    return NextResponse.json({ error: 'Failed to fetch reasons' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, name_ar, type, is_active } = body;

    const [newReason] = await db.insert(reasons).values({
      name,
      nameAr: name_ar,
      type,
      isActive: is_active !== false,
    }).returning();

    return NextResponse.json({
      ...newReason,
      name_ar: newReason.nameAr,
      is_active: newReason.isActive,
      created_at: newReason.createdAt?.toISOString(),
      updated_at: newReason.updatedAt?.toISOString(),
    });
  } catch (error) {
    console.error('Create reason error:', error);
    return NextResponse.json({ error: 'Failed to create reason' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, name_ar, type, is_active } = body;

    const [updated] = await db.update(reasons)
      .set({
        name,
        nameAr: name_ar,
        type,
        isActive: is_active,
      })
      .where(eq(reasons.id, id))
      .returning();

    return NextResponse.json({
      ...updated,
      name_ar: updated.nameAr,
      is_active: updated.isActive,
      created_at: updated.createdAt?.toISOString(),
      updated_at: updated.updatedAt?.toISOString(),
    });
  } catch (error) {
    console.error('Update reason error:', error);
    return NextResponse.json({ error: 'Failed to update reason' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await db.delete(reasons).where(eq(reasons.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete reason error:', error);
    return NextResponse.json({ error: 'Failed to delete reason' }, { status: 500 });
  }
}
