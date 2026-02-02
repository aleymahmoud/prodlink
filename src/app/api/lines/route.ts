import { NextRequest, NextResponse } from 'next/server';
import { db, lines, profiles, userLineAssignments } from '@/shared/lib/db';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allLines = await db
      .select({
        id: lines.id,
        name: lines.name,
        code: lines.code,
        type: lines.type,
        formApproverId: lines.formApproverId,
        isActive: lines.isActive,
        createdAt: lines.createdAt,
        updatedAt: lines.updatedAt,
        formApprover: {
          id: profiles.id,
          fullName: profiles.fullName,
          email: profiles.email,
        },
      })
      .from(lines)
      .leftJoin(profiles, eq(lines.formApproverId, profiles.id))
      .orderBy(desc(lines.createdAt));

    // Transform to match expected format
    const result = allLines.map(line => ({
      ...line,
      form_approver_id: line.formApproverId,
      is_active: line.isActive,
      created_at: line.createdAt?.toISOString(),
      updated_at: line.updatedAt?.toISOString(),
      form_approver: line.formApprover?.id ? {
        id: line.formApprover.id,
        full_name: line.formApprover.fullName,
        email: line.formApprover.email,
      } : null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Lines API error:', error);
    return NextResponse.json({ error: 'Failed to fetch lines' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, code, type, form_approver_id, is_active } = body;

    const [newLine] = await db.insert(lines).values({
      name,
      code,
      type: type || 'finished',
      formApproverId: form_approver_id || null,
      isActive: is_active !== false,
    }).returning();

    return NextResponse.json({
      ...newLine,
      form_approver_id: newLine.formApproverId,
      is_active: newLine.isActive,
      created_at: newLine.createdAt?.toISOString(),
      updated_at: newLine.updatedAt?.toISOString(),
    });
  } catch (error) {
    console.error('Create line error:', error);
    return NextResponse.json({ error: 'Failed to create line' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, code, type, form_approver_id, is_active } = body;

    const [updated] = await db.update(lines)
      .set({
        name,
        code,
        type,
        formApproverId: form_approver_id || null,
        isActive: is_active,
      })
      .where(eq(lines.id, id))
      .returning();

    return NextResponse.json({
      ...updated,
      form_approver_id: updated.formApproverId,
      is_active: updated.isActive,
      created_at: updated.createdAt?.toISOString(),
      updated_at: updated.updatedAt?.toISOString(),
    });
  } catch (error) {
    console.error('Update line error:', error);
    return NextResponse.json({ error: 'Failed to update line' }, { status: 500 });
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

    await db.delete(lines).where(eq(lines.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete line error:', error);
    return NextResponse.json({ error: 'Failed to delete line' }, { status: 500 });
  }
}
