import { NextRequest, NextResponse } from 'next/server';
import { db, approvalLevelAssignments, profiles } from '@/shared/lib/db';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

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
    const { approval_level_id, user_id } = body;

    if (!approval_level_id || !user_id) {
      return NextResponse.json({ error: 'Approval level ID and user ID are required' }, { status: 400 });
    }

    // Check if assignment already exists
    const existing = await db
      .select()
      .from(approvalLevelAssignments)
      .where(
        and(
          eq(approvalLevelAssignments.approvalLevelId, approval_level_id),
          eq(approvalLevelAssignments.userId, user_id)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'User is already assigned to this approval level' }, { status: 400 });
    }

    // Get user info
    const [user] = await db
      .select({ id: profiles.id, fullName: profiles.fullName, email: profiles.email })
      .from(profiles)
      .where(eq(profiles.id, user_id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [newAssignment] = await db
      .insert(approvalLevelAssignments)
      .values({
        approvalLevelId: approval_level_id,
        userId: user_id,
      })
      .returning();

    return NextResponse.json({
      id: newAssignment.id,
      user_id: newAssignment.userId,
      user_name: user.fullName,
      user_email: user.email,
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment' },
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
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    await db.delete(approvalLevelAssignments).where(eq(approvalLevelAssignments.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete assignment error:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}
