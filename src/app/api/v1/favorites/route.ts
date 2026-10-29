import { NextRequest } from "next/server";
import { db } from "@/db";
import { favorites, products } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { apiError, apiSuccess, getAuthenticatedUser } from "@/lib/auth";
import { hydrateProducts } from "@/lib/products-helper";
import { desc, eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError("Authentication required to view favorites", 401);
    }

    const favRows = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, currentUser.id))
      .orderBy(desc(favorites.createdAt));

    if (favRows.length === 0) {
      return apiSuccess("Favorites retrieved", []);
    }

    const productIds = favRows.map((f) => f.productId);
    const prodRows = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const hydrated = await hydrateProducts(prodRows, currentUser.id);
    // Preserve favorite order
    const mapById = new Map(hydrated.map((p) => [p.id, p]));
    const ordered = productIds
      .map((id) => mapById.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));

    return apiSuccess("Favorites retrieved successfully", ordered);
  } catch (err) {
    console.error("Get favorites error:", err);
    return apiError("Failed to retrieve favorites", 500);
  }
}
