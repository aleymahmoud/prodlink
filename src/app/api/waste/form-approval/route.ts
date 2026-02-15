import { NextRequest, NextResponse } from 'next/server';
import { db, wasteEntries, lines } from '@/shared/lib/db';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, form_approved } = body;

    if (!id) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    // Get the waste entry
    const [entry] = await db
      .select({
        id: wasteEntries.id,
        lineId: wasteEntries.lineId,
        appApproved: wasteEntries.appApproved,
      })
      .from(wasteEntries)
      .where(eq(wasteEntries.id, id))
      .limit(1);

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Check if entry is app-approved first
    if (!entry.appApproved) {
      return NextResponse.json({ error: 'Entry must be app-approved before form approval' }, { status: 400 });
    }

    // Get the line to check form approver
    const [line] = await db
      .select({
        id: lines.id,
        formApproverId: lines.formApproverId,
      })
      .from(lines)
      .where(eq(lines.id, entry.lineId))
      .limit(1);

    // Check if user is admin or the designated form approver for this line
    const isAdmin = session.user.role === 'admin';
    const isFormApprover = line?.formApproverId === session.user.id;

    if (!isAdmin && !isFormApprover) {
      return NextResponse.json({
        error: 'Only admins or the designated form approver for this line can mark form as approved'
      }, { status: 403 });
    }

    // Update the form approval status
    const [updated] = await db.update(wasteEntries)
      .set({
        formApproved: form_approved,
        updatedAt: new Date(),
      })
      .where(eq(wasteEntries.id, id))
      .returning();

    return NextResponse.json({
      id: updated.id,
      form_approved: updated.formApproved,
      message: form_approved ? 'Form marked as approved' : 'Form approval removed',
    });
  } catch (error) {
    console.error('Form approval error:', error);
    return NextResponse.json({ error: 'Failed to update form approval' }, { status: 500 });
  }
}
