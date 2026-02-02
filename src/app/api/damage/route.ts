import { NextRequest, NextResponse } from 'next/server';
import { db, damageEntries, products, lines, profiles, reasons } from '@/shared/lib/db';
import { eq, desc, gte, and } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lineId = searchParams.get('line_id');

    let conditions = [];
    if (lineId) {
      conditions.push(eq(damageEntries.lineId, lineId));
    }

    const entries = await db
      .select({
        id: damageEntries.id,
        lineId: damageEntries.lineId,
        productId: damageEntries.productId,
        quantity: damageEntries.quantity,
        unitOfMeasure: damageEntries.unitOfMeasure,
        batchNumber: damageEntries.batchNumber,
        reasonId: damageEntries.reasonId,
        notes: damageEntries.notes,
        createdBy: damageEntries.createdBy,
        createdAt: damageEntries.createdAt,
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
      .from(damageEntries)
      .leftJoin(products, eq(damageEntries.productId, products.id))
      .leftJoin(lines, eq(damageEntries.lineId, lines.id))
      .leftJoin(profiles, eq(damageEntries.createdBy, profiles.id))
      .leftJoin(reasons, eq(damageEntries.reasonId, reasons.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(damageEntries.createdAt))
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
      created_by: entry.createdBy,
      created_at: entry.createdAt?.toISOString(),
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
    console.error('Damage API error:', error);
    return NextResponse.json({ error: 'Failed to fetch damage entries' }, { status: 500 });
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

    const [newEntry] = await db.insert(damageEntries).values({
      lineId: line_id,
      productId: product_id,
      quantity: quantity.toString(),
      unitOfMeasure: unit_of_measure,
      batchNumber: batch_number,
      reasonId: reason_id,
      notes,
      createdBy: session.user.id,
    }).returning();

    return NextResponse.json({
      id: newEntry.id,
      line_id: newEntry.lineId,
      product_id: newEntry.productId,
      quantity: Number(newEntry.quantity),
      unit_of_measure: newEntry.unitOfMeasure,
      batch_number: newEntry.batchNumber,
      reason_id: newEntry.reasonId,
      notes: newEntry.notes,
      created_by: newEntry.createdBy,
      created_at: newEntry.createdAt?.toISOString(),
    });
  } catch (error) {
    console.error('Create damage entry error:', error);
    return NextResponse.json({ error: 'Failed to create damage entry' }, { status: 500 });
  }
}
