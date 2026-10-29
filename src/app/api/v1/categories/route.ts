import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { apiError, apiSuccess } from "@/lib/auth";
import { asc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();
    const allCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.id));

    const productCounts = await db
      .select({
        categoryId: products.categoryId,
        count: sql<number>`count(*)::int`,
      })
      .from(products)
      .where(eq(products.status, "Active"))
      .groupBy(products.categoryId);

    const countMap = new Map(
      productCounts.map((row) => [row.categoryId, row.count])
    );

    const enriched = allCategories.map((c) => ({
      ...c,
      activeCount: countMap.get(c.id) || 0,
    }));

    return apiSuccess("Categories retrieved successfully", enriched);
  } catch (err) {
    console.error("Get categories error:", err);
    return apiError("Failed to load categories", 500);
  }
}
