import { NextRequest, NextResponse } from 'next/server';
import { db, approvalLevels, approvalLevelAssignments, profiles } from '@/shared/lib/db';
import { eq, asc, desc } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const levels = await db
      .select({
        id: approvalLevels.id,
        name: approvalLevels.name,
        name_ar: approvalLevels.nameAr,
        level_order: approvalLevels.levelOrder,
        approval_type: approvalLevels.approvalType,
        is_active: approvalLevels.isActive,
        created_at: approvalLevels.createdAt,
      })
      .from(approvalLevels)
      .orderBy(asc(approvalLevels.levelOrder));

    // Get assignments for each level
    const assignments = await db
      .select({
        id: approvalLevelAssignments.id,
        approval_level_id: approvalLevelAssignments.approvalLevelId,
        user_id: approvalLevelAssignments.userId,
        user_name: profiles.fullName,
        user_email: profiles.email,
      })
      .from(approvalLevelAssignments)
      .leftJoin(profiles, eq(approvalLevelAssignments.userId, profiles.id));

    // Map assignments to levels
    const result = levels.map(level => ({
      ...level,
      approvers: assignments
        .filter(a => a.approval_level_id === level.id)
        .map(a => ({
          id: a.id,
          user_id: a.user_id,
          user_name: a.user_name,
          user_email: a.user_email,
        })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Approval levels fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch approval levels' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, name_ar, approval_type } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Get the next level order
    const lastLevel = await db
      .select({ levelOrder: approvalLevels.levelOrder })
      .from(approvalLevels)
      .orderBy(desc(approvalLevels.levelOrder))
      .limit(1);

    const nextOrder = lastLevel.length > 0 ? lastLevel[0].levelOrder + 1 : 1;

    const [newLevel] = await db
      .insert(approvalLevels)
      .values({
        name: name.trim(),
        nameAr: name_ar?.trim() || null,
        levelOrder: nextOrder,
        approvalType: approval_type || 'sequential',
        isActive: true,
      })
      .returning();

    return NextResponse.json({
      id: newLevel.id,
      name: newLevel.name,
      name_ar: newLevel.nameAr,
      level_order: newLevel.levelOrder,
      approval_type: newLevel.approvalType,
      is_active: newLevel.isActive,
      approvers: [],
    });
  } catch (error) {
    console.error('Create approval level error:', error);
    return NextResponse.json(
      { error: 'Failed to create approval level' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, name_ar, approval_type, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (name_ar !== undefined) {
      updateData.nameAr = name_ar?.trim() || null;
    }

    if (approval_type !== undefined) {
      if (!['sequential', 'parallel'].includes(approval_type)) {
        return NextResponse.json({ error: 'Invalid approval type' }, { status: 400 });
      }
      updateData.approvalType = approval_type;
    }

    if (is_active !== undefined) {
      updateData.isActive = is_active;
    }

    const [updated] = await db
      .update(approvalLevels)
      .set(updateData)
      .where(eq(approvalLevels.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Approval level not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      name_ar: updated.nameAr,
      level_order: updated.levelOrder,
      approval_type: updated.approvalType,
      is_active: updated.isActive,
    });
  } catch (error) {
    console.error('Update approval level error:', error);
    return NextResponse.json(
      { error: 'Failed to update approval level' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.delete(approvalLevels).where(eq(approvalLevels.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete approval level error:', error);
    return NextResponse.json(
      { error: 'Failed to delete approval level' },
      { status: 500 }
    );
  }
}
