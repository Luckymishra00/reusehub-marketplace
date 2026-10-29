import { NextRequest } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { apiError, apiSuccess, getAuthenticatedUser } from "@/lib/auth";
import { hydrateProducts } from "@/lib/products-helper";
import { and, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    const whereClause =
      statusFilter && statusFilter !== "all"
        ? and(
            eq(products.sellerId, currentUser.id),
            eq(products.status, statusFilter)
          )
        : eq(products.sellerId, currentUser.id);

    const myRows = await db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(desc(products.createdAt));

    const hydrated = await hydrateProducts(myRows, currentUser.id);
    return apiSuccess("Your listings retrieved successfully", hydrated);
  } catch (err) {
    console.error("Get my products error:", err);
    return apiError("Failed to retrieve your listings", 500);
  }
}
