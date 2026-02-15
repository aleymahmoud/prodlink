import { NextRequest, NextResponse } from 'next/server';
import { db, products } from '@/shared/lib/db';
import { auth } from '@/auth';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { products: productList } = body;

    if (!Array.isArray(productList) || productList.length === 0) {
      return NextResponse.json({ error: 'Products array is required' }, { status: 400 });
    }

    // Transform to match schema
    const productsToInsert = productList.map((p: { name: string; code: string; category?: string; unit_of_measure?: string; line_id?: string }) => ({
      name: p.name,
      code: p.code,
      category: p.category || null,
      unitOfMeasure: p.unit_of_measure || 'unit',
      lineId: p.line_id || null,
    }));

    // Insert products one by one with upsert behavior
    let imported = 0;
    for (const product of productsToInsert) {
      try {
        // Try to insert, on conflict update
        await db.insert(products)
          .values(product)
          .onConflictDoUpdate({
            target: products.code,
            set: {
              name: product.name,
              category: product.category,
              unitOfMeasure: product.unitOfMeasure,
              lineId: product.lineId,
              updatedAt: new Date(),
            },
          });
        imported++;
      } catch (err) {
        console.error(`Failed to import product ${product.code}:`, err);
      }
    }

    return NextResponse.json({
      imported,
      total: productList.length,
    });
  } catch (error) {
    console.error('Import products error:', error);
    return NextResponse.json({ error: 'Failed to import products' }, { status: 500 });
  }
}
