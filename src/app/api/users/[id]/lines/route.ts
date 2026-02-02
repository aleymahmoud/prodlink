import { NextRequest, NextResponse } from 'next/server';
import { db, userLineAssignments } from '@/shared/lib/db';
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

    const assignments = await db
      .select({
        id: userLineAssignments.id,
        line_id: userLineAssignments.lineId,
      })
      .from(userLineAssignments)
      .where(eq(userLineAssignments.userId, id));

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('User lines API error:', error);
    return NextResponse.json({ error: 'Failed to fetch user lines' }, { status: 500 });
  }
}
