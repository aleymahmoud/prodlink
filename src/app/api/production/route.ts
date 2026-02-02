import { NextRequest, NextResponse } from 'next/server';
import { db, productionEntries, products, lines, profiles } from '@/shared/lib/db';
import { eq, desc, gte, and, inArray } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lineId = searchParams.get('line_id');
    const startDate = searchParams.get('start_date');

    let conditions = [];
    if (lineId) {
      conditions.push(eq(productionEntries.lineId, lineId));
    }
    if (startDate) {
      conditions.push(gte(productionEntries.createdAt, new Date(startDate)));
    }

    const entries = await db
      .select({
        id: productionEntries.id,
        lineId: productionEntries.lineId,
        productId: productionEntries.productId,
        quantity: productionEntries.quantity,
        unitOfMeasure: productionEntries.unitOfMeasure,
        batchNumber: productionEntries.batchNumber,
        notes: productionEntries.notes,
        createdBy: productionEntries.createdBy,
        createdAt: productionEntries.createdAt,
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
      })
      .from(productionEntries)
      .leftJoin(products, eq(productionEntries.productId, products.id))
      .leftJoin(lines, eq(productionEntries.lineId, lines.id))
      .leftJoin(profiles, eq(productionEntries.createdBy, profiles.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(productionEntries.createdAt))
      .limit(100);

    const result = entries.map(entry => ({
      id: entry.id,
      line_id: entry.lineId,
      product_id: entry.productId,
      quantity: Number(entry.quantity),
      unit_of_measure: entry.unitOfMeasure,
      batch_number: entry.batchNumber,
      notes: entry.notes,
      created_by: entry.createdBy,
      created_at: entry.createdAt?.toISOString(),
      products: entry.product,
      lines: entry.line,
      profiles: entry.profile ? {
        id: entry.profile.id,
        full_name: entry.profile.fullName,
      } : null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Production API error:', error);
    return NextResponse.json({ error: 'Failed to fetch production entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { line_id, product_id, quantity, unit_of_measure, batch_number, notes } = body;

    const [newEntry] = await db.insert(productionEntries).values({
      lineId: line_id,
      productId: product_id,
      quantity: quantity.toString(),
      unitOfMeasure: unit_of_measure,
      batchNumber: batch_number,
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
      notes: newEntry.notes,
      created_by: newEntry.createdBy,
      created_at: newEntry.createdAt?.toISOString(),
    });
  } catch (error) {
    console.error('Create production entry error:', error);
    return NextResponse.json({ error: 'Failed to create production entry' }, { status: 500 });
  }
}
