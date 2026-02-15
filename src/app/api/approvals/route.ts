import { NextRequest, NextResponse } from 'next/server';
import { db, wasteEntries, products, lines, profiles, reasons, approvalLevels, approvalLevelAssignments, wasteApprovals } from '@/shared/lib/db';
import { eq, desc, and, asc, inArray } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Get the approval levels the current user is assigned to
    const userAssignments = await db
      .select({
        approvalLevelId: approvalLevelAssignments.approvalLevelId,
        levelOrder: approvalLevels.levelOrder,
      })
      .from(approvalLevelAssignments)
      .innerJoin(approvalLevels, eq(approvalLevelAssignments.approvalLevelId, approvalLevels.id))
      .where(eq(approvalLevelAssignments.userId, session.user.id));

    const userLevelOrders = userAssignments.map(a => a.levelOrder);
    const isAdmin = session.user.role === 'admin';

    let conditions = [];
    if (status && status !== 'all') {
      conditions.push(eq(wasteEntries.approvalStatus, status as 'pending' | 'approved' | 'rejected'));
    }

    // If user is not admin and has level assignments, only show entries at their levels
    // If user is admin, show all entries
    // If user has no assignments but is approver role, show entries at level 1 (fallback)
    if (!isAdmin && userLevelOrders.length > 0) {
      conditions.push(inArray(wasteEntries.currentApprovalLevel, userLevelOrders));
    }

    const entries = await db
      .select({
        id: wasteEntries.id,
        lineId: wasteEntries.lineId,
        productId: wasteEntries.productId,
        quantity: wasteEntries.quantity,
        unitOfMeasure: wasteEntries.unitOfMeasure,
        batchNumber: wasteEntries.batchNumber,
        reasonId: wasteEntries.reasonId,
        notes: wasteEntries.notes,
        approvalStatus: wasteEntries.approvalStatus,
        currentApprovalLevel: wasteEntries.currentApprovalLevel,
        appApproved: wasteEntries.appApproved,
        formApproved: wasteEntries.formApproved,
        createdBy: wasteEntries.createdBy,
        createdAt: wasteEntries.createdAt,
        product: {
          id: products.id,
          name: products.name,
          code: products.code,
        },
        line: {
          id: lines.id,
          name: lines.name,
          code: lines.code,
        },
        profile: {
          id: profiles.id,
          fullName: profiles.fullName,
        },
        reason: {
          id: reasons.id,
          name: reasons.name,
          nameAr: reasons.nameAr,
        },
      })
      .from(wasteEntries)
      .leftJoin(products, eq(wasteEntries.productId, products.id))
      .leftJoin(lines, eq(wasteEntries.lineId, lines.id))
      .leftJoin(profiles, eq(wasteEntries.createdBy, profiles.id))
      .leftJoin(reasons, eq(wasteEntries.reasonId, reasons.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(wasteEntries.createdAt))
      .limit(100);

    // Get all approval levels for reference
    const allLevels = await db
      .select()
      .from(approvalLevels)
      .where(eq(approvalLevels.isActive, true))
      .orderBy(asc(approvalLevels.levelOrder));

    const result = entries.map(entry => ({
      id: entry.id,
      quantity: Number(entry.quantity),
      notes: entry.notes,
      status: entry.approvalStatus,
      current_approval_level: entry.currentApprovalLevel,
      app_approved: entry.appApproved,
      form_approved: entry.formApproved,
      total_levels: allLevels.length,
      created_at: entry.createdAt?.toISOString(),
      line: entry.line ? { name: entry.line.name } : null,
      product: entry.product ? { name: entry.product.name } : null,
      reason: entry.reason ? {
        name: entry.reason.name,
        name_ar: entry.reason.nameAr,
      } : null,
      recorded_by_user: entry.profile ? {
        full_name: entry.profile.fullName,
      } : null,
      can_approve: isAdmin || userLevelOrders.includes(entry.currentApprovalLevel || 1),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Approvals API error:', error);
    return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can approve
    if (!['admin', 'approver'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden: Only admins and approvers can approve entries' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, comments } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get the waste entry
    const [entry] = await db
      .select()
      .from(wasteEntries)
      .where(eq(wasteEntries.id, id))
      .limit(1);

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Get all active approval levels
    const allLevels = await db
      .select()
      .from(approvalLevels)
      .where(eq(approvalLevels.isActive, true))
      .orderBy(asc(approvalLevels.levelOrder));

    // Find current level
    const currentLevel = allLevels.find(l => l.levelOrder === entry.currentApprovalLevel);

    if (!currentLevel) {
      // No approval levels configured, just approve directly
      const [updated] = await db.update(wasteEntries)
        .set({
          approvalStatus: status,
          appApproved: status === 'approved',
          updatedAt: new Date(),
        })
        .where(eq(wasteEntries.id, id))
        .returning();

      return NextResponse.json({
        id: updated.id,
        status: updated.approvalStatus,
        app_approved: updated.appApproved,
      });
    }

    // Check if user is assigned to this level (or is admin)
    const isAdmin = session.user.role === 'admin';
    if (!isAdmin) {
      const userAssignment = await db
        .select()
        .from(approvalLevelAssignments)
        .where(
          and(
            eq(approvalLevelAssignments.approvalLevelId, currentLevel.id),
            eq(approvalLevelAssignments.userId, session.user.id)
          )
        )
        .limit(1);

      if (userAssignment.length === 0) {
        return NextResponse.json({ error: 'You are not authorized to approve at this level' }, { status: 403 });
      }
    }

    // Update the wasteApprovals record for this level
    await db.update(wasteApprovals)
      .set({
        status: status,
        approvedBy: session.user.id,
        comments: comments || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(wasteApprovals.wasteEntryId, id),
          eq(wasteApprovals.approvalLevelId, currentLevel.id)
        )
      );

    // If rejected, mark the entire entry as rejected
    if (status === 'rejected') {
      const [updated] = await db.update(wasteEntries)
        .set({
          approvalStatus: 'rejected',
          updatedAt: new Date(),
        })
        .where(eq(wasteEntries.id, id))
        .returning();

      return NextResponse.json({
        id: updated.id,
        status: updated.approvalStatus,
        message: 'Entry rejected',
      });
    }

    // If approved, check if there's a next level
    const currentIndex = allLevels.findIndex(l => l.id === currentLevel.id);
    const nextLevel = allLevels[currentIndex + 1];

    if (nextLevel) {
      // Move to next level
      const [updated] = await db.update(wasteEntries)
        .set({
          currentApprovalLevel: nextLevel.levelOrder,
          updatedAt: new Date(),
        })
        .where(eq(wasteEntries.id, id))
        .returning();

      return NextResponse.json({
        id: updated.id,
        status: updated.approvalStatus,
        current_approval_level: updated.currentApprovalLevel,
        message: `Approved at level ${currentLevel.levelOrder}. Moved to level ${nextLevel.levelOrder}.`,
      });
    } else {
      // This was the last level, mark as fully approved
      const [updated] = await db.update(wasteEntries)
        .set({
          approvalStatus: 'approved',
          appApproved: true,
          updatedAt: new Date(),
        })
        .where(eq(wasteEntries.id, id))
        .returning();

      return NextResponse.json({
        id: updated.id,
        status: updated.approvalStatus,
        app_approved: updated.appApproved,
        message: 'Fully approved at all levels',
      });
    }
  } catch (error) {
    console.error('Update approval error:', error);
    return NextResponse.json({ error: 'Failed to update approval' }, { status: 500 });
  }
}
