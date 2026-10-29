import { NextRequest } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { apiError, apiSuccess, getAuthenticatedUser } from "@/lib/auth";
import { hydrateProducts } from "@/lib/products-helper";
import { and, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSeeded();
    const { id } = await context.params;
    const sellerId = Number(id);
    if (Number.isNaN(sellerId) || sellerId <= 0) {
      return apiError("Invalid user ID", 400);
    }

    const currentUser = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") || "Active";

    const rows = await db
      .select()
      .from(products)
      .where(
        and(eq(products.sellerId, sellerId), eq(products.status, statusParam))
      )
      .orderBy(desc(products.createdAt));

    const hydrated = await hydrateProducts(rows, currentUser?.id);
    return apiSuccess("User products retrieved", hydrated);
  } catch (err) {
    console.error("Get user products error:", err);
    return apiError("Failed to retrieve user products", 500);
  }
}
