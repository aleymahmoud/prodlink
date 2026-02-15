import { NextRequest, NextResponse } from 'next/server';
import { db, wasteEntries, products, lines, profiles, reasons, approvalLevels, wasteApprovals } from '@/shared/lib/db';
import { eq, desc, and, asc } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lineId = searchParams.get('line_id');
    const status = searchParams.get('status');

    let conditions = [];
    if (lineId) {
      conditions.push(eq(wasteEntries.lineId, lineId));
    }
    if (status) {
      conditions.push(eq(wasteEntries.approvalStatus, status as 'pending' | 'approved' | 'rejected'));
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
        appApproved: wasteEntries.appApproved,
        formApproved: wasteEntries.formApproved,
        currentApprovalLevel: wasteEntries.currentApprovalLevel,
        approvalStatus: wasteEntries.approvalStatus,
        createdBy: wasteEntries.createdBy,
        createdAt: wasteEntries.createdAt,
        updatedAt: wasteEntries.updatedAt,
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

    const result = entries.map(entry => ({
      id: entry.id,
      line_id: entry.lineId,
      product_id: entry.productId,
      quantity: Number(entry.quantity),
      unit_of_measure: entry.unitOfMeasure,
      batch_number: entry.batchNumber,
      reason_id: entry.reasonId,
      notes: entry.notes,
      app_approved: entry.appApproved,
      form_approved: entry.formApproved,
      current_approval_level: entry.currentApprovalLevel,
      approval_status: entry.approvalStatus,
      created_by: entry.createdBy,
      created_at: entry.createdAt?.toISOString(),
      updated_at: entry.updatedAt?.toISOString(),
      products: entry.product,
      lines: entry.line,
      profiles: entry.profile ? {
        id: entry.profile.id,
        full_name: entry.profile.fullName,
      } : null,
      reasons: entry.reason ? {
        id: entry.reason.id,
        name: entry.reason.name,
        name_ar: entry.reason.nameAr,
      } : null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Waste API error:', error);
    return NextResponse.json({ error: 'Failed to fetch waste entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { line_id, product_id, quantity, unit_of_measure, batch_number, reason_id, notes } = body;

    // Get all active approval levels
    const activelevels = await db
      .select()
      .from(approvalLevels)
      .where(eq(approvalLevels.isActive, true))
      .orderBy(asc(approvalLevels.levelOrder));

    // Create the waste entry
    const [newEntry] = await db.insert(wasteEntries).values({
      lineId: line_id,
      productId: product_id,
      quantity: quantity.toString(),
      unitOfMeasure: unit_of_measure,
      batchNumber: batch_number,
      reasonId: reason_id,
      notes,
      createdBy: session.user.id,
      currentApprovalLevel: activelevels.length > 0 ? activelevels[0].levelOrder : 1,
      approvalStatus: 'pending',
    }).returning();

    // Create wasteApprovals records for each approval level
    if (activelevels.length > 0) {
      const approvalRecords = activelevels.map(level => ({
        wasteEntryId: newEntry.id,
        approvalLevelId: level.id,
        status: 'pending' as const,
      }));

      await db.insert(wasteApprovals).values(approvalRecords);
    }

    return NextResponse.json({
      id: newEntry.id,
      line_id: newEntry.lineId,
      product_id: newEntry.productId,
      quantity: Number(newEntry.quantity),
      unit_of_measure: newEntry.unitOfMeasure,
      batch_number: newEntry.batchNumber,
      reason_id: newEntry.reasonId,
      notes: newEntry.notes,
      approval_status: newEntry.approvalStatus,
      current_approval_level: newEntry.currentApprovalLevel,
      created_by: newEntry.createdBy,
      created_at: newEntry.createdAt?.toISOString(),
    });
  } catch (error) {
    console.error('Create waste entry error:', error);
    return NextResponse.json({ error: 'Failed to create waste entry' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !['admin', 'approver'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, approval_status, app_approved, form_approved } = body;

    const [updated] = await db.update(wasteEntries)
      .set({
        approvalStatus: approval_status,
        appApproved: app_approved,
        formApproved: form_approved,
      })
      .where(eq(wasteEntries.id, id))
      .returning();

    return NextResponse.json({
      id: updated.id,
      approval_status: updated.approvalStatus,
      app_approved: updated.appApproved,
      form_approved: updated.formApproved,
    });
  } catch (error) {
    console.error('Update waste entry error:', error);
    return NextResponse.json({ error: 'Failed to update waste entry' }, { status: 500 });
  }
}
