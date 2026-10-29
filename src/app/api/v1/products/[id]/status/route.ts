import { NextRequest } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { apiError, apiSuccess, getAuthenticatedUser } from "@/lib/auth";
import { hydrateProducts, VALID_STATUSES } from "@/lib/products-helper";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }

    const { id } = await context.params;
    const productId = Number(id);
    if (Number.isNaN(productId) || productId <= 0) {
      return apiError("Invalid product ID", 400);
    }

    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!existing) {
      return apiError("Listing not found", 404);
    }

    if (
      existing.sellerId !== currentUser.id &&
      currentUser.role !== "admin"
    ) {
      return apiError(
        "Forbidden: Only the listing owner can change its status",
        403
      );
    }

    const body = await req.json();
    const newStatus = String(body.status || "").trim();

    if (
      !VALID_STATUSES.includes(newStatus as (typeof VALID_STATUSES)[number])
    ) {
      return apiError("Invalid status transition", 400, [
        {
          field: "status",
          message: `Status must be one of: ${VALID_STATUSES.join(", ")}`,
        },
      ]);
    }

    const [updated] = await db
      .update(products)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(products.id, productId))
      .returning();

    const [hydrated] = await hydrateProducts([updated], currentUser.id);
    return apiSuccess(`Listing marked as ${newStatus}`, hydrated);
  } catch (err) {
    console.error("Status update error:", err);
    return apiError("Failed to update listing status", 500);
  }
}
