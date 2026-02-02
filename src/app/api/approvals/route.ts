import { NextRequest, NextResponse } from 'next/server';
import { db, wasteEntries, products, lines, profiles, reasons } from '@/shared/lib/db';
import { eq, desc, and } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let conditions = [];
    if (status && status !== 'all') {
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
        approvalStatus: wasteEntries.approvalStatus,
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

    const result = entries.map(entry => ({
      id: entry.id,
      quantity: Number(entry.quantity),
      notes: entry.notes,
      status: entry.approvalStatus,
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
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const [updated] = await db.update(wasteEntries)
      .set({
        approvalStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(wasteEntries.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: updated.id,
      status: updated.approvalStatus,
    });
  } catch (error) {
    console.error('Update approval error:', error);
    return NextResponse.json({ error: 'Failed to update approval' }, { status: 500 });
  }
}
