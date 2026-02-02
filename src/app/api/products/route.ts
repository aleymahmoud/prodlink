import { NextRequest, NextResponse } from 'next/server';
import { db, products, lines } from '@/shared/lib/db';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allProducts = await db
      .select({
        id: products.id,
        name: products.name,
        code: products.code,
        category: products.category,
        unitOfMeasure: products.unitOfMeasure,
        lineId: products.lineId,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        line: {
          id: lines.id,
          name: lines.name,
          code: lines.code,
        },
      })
      .from(products)
      .leftJoin(lines, eq(products.lineId, lines.id))
      .orderBy(desc(products.createdAt));

    const result = allProducts.map(product => ({
      ...product,
      unit_of_measure: product.unitOfMeasure,
      line_id: product.lineId,
      is_active: product.isActive,
      created_at: product.createdAt?.toISOString(),
      updated_at: product.updatedAt?.toISOString(),
      lines: product.line?.id ? product.line : null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, code, category, unit_of_measure, line_id, is_active } = body;

    const [newProduct] = await db.insert(products).values({
      name,
      code,
      category,
      unitOfMeasure: unit_of_measure || 'unit',
      lineId: line_id || null,
      isActive: is_active !== false,
    }).returning();

    return NextResponse.json({
      ...newProduct,
      unit_of_measure: newProduct.unitOfMeasure,
      line_id: newProduct.lineId,
      is_active: newProduct.isActive,
      created_at: newProduct.createdAt?.toISOString(),
      updated_at: newProduct.updatedAt?.toISOString(),
    });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, code, category, unit_of_measure, line_id, is_active } = body;

    const [updated] = await db.update(products)
      .set({
        name,
        code,
        category,
        unitOfMeasure: unit_of_measure,
        lineId: line_id || null,
        isActive: is_active,
      })
      .where(eq(products.id, id))
      .returning();

    return NextResponse.json({
      ...updated,
      unit_of_measure: updated.unitOfMeasure,
      line_id: updated.lineId,
      is_active: updated.isActive,
      created_at: updated.createdAt?.toISOString(),
      updated_at: updated.updatedAt?.toISOString(),
    });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await db.delete(products).where(eq(products.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
