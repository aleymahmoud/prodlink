import { NextResponse } from 'next/server';
import { db, productionEntries, wasteEntries, damageEntries, reprocessingEntries, products, profiles } from '@/shared/lib/db';
import { eq, gte, sql, desc } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch today's production count
    const [productionResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productionEntries)
      .where(gte(productionEntries.createdAt, today));

    // Fetch pending waste approvals
    const [pendingResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(wasteEntries)
      .where(eq(wasteEntries.approvalStatus, 'pending'));

    // Fetch today's waste count
    const [wasteResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(wasteEntries)
      .where(gte(wasteEntries.createdAt, today));

    // Fetch today's reprocessing count
    const [reprocessingResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reprocessingEntries)
      .where(gte(reprocessingEntries.createdAt, today));

    // Fetch recent production entries
    const recentProduction = await db
      .select({
        id: productionEntries.id,
        quantity: productionEntries.quantity,
        createdAt: productionEntries.createdAt,
        productName: products.name,
        userName: profiles.fullName,
      })
      .from(productionEntries)
      .leftJoin(products, eq(productionEntries.productId, products.id))
      .leftJoin(profiles, eq(productionEntries.createdBy, profiles.id))
      .orderBy(desc(productionEntries.createdAt))
      .limit(5);

    // Fetch recent waste entries
    const recentWaste = await db
      .select({
        id: wasteEntries.id,
        quantity: wasteEntries.quantity,
        createdAt: wasteEntries.createdAt,
        productName: products.name,
        userName: profiles.fullName,
      })
      .from(wasteEntries)
      .leftJoin(products, eq(wasteEntries.productId, products.id))
      .leftJoin(profiles, eq(wasteEntries.createdBy, profiles.id))
      .orderBy(desc(wasteEntries.createdAt))
      .limit(5);

    // Fetch recent damage entries
    const recentDamage = await db
      .select({
        id: damageEntries.id,
        quantity: damageEntries.quantity,
        createdAt: damageEntries.createdAt,
        productName: products.name,
        userName: profiles.fullName,
      })
      .from(damageEntries)
      .leftJoin(products, eq(damageEntries.productId, products.id))
      .leftJoin(profiles, eq(damageEntries.createdBy, profiles.id))
      .orderBy(desc(damageEntries.createdAt))
      .limit(5);

    // Combine and format activities
    const activities = [
      ...recentProduction.map(e => ({
        id: e.id,
        type: 'production' as const,
        product_name: e.productName || 'Unknown',
        quantity: Number(e.quantity),
        created_at: e.createdAt.toISOString(),
        user_name: e.userName || 'Unknown',
      })),
      ...recentWaste.map(e => ({
        id: e.id,
        type: 'waste' as const,
        product_name: e.productName || 'Unknown',
        quantity: Number(e.quantity),
        created_at: e.createdAt.toISOString(),
        user_name: e.userName || 'Unknown',
      })),
      ...recentDamage.map(e => ({
        id: e.id,
        type: 'damage' as const,
        product_name: e.productName || 'Unknown',
        quantity: Number(e.quantity),
        created_at: e.createdAt.toISOString(),
        user_name: e.userName || 'Unknown',
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    return NextResponse.json({
      stats: {
        todayProduction: Number(productionResult?.count || 0),
        pendingApprovals: Number(pendingResult?.count || 0),
        todayWaste: Number(wasteResult?.count || 0),
        todayReprocessing: Number(reprocessingResult?.count || 0),
      },
      recentActivity: activities,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
