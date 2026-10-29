import { NextRequest } from "next/server";
import { db } from "@/db";
import { productImages, products } from "@/db/schema";
import { apiError, apiSuccess, getAuthenticatedUser } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }

    const { id, imageId } = await context.params;
    const productId = Number(id);
    const imgId = Number(imageId);

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return apiError("Listing not found", 404);
    }

    if (product.sellerId !== currentUser.id && currentUser.role !== "admin") {
      return apiError("Forbidden: Cannot modify another seller's image", 403);
    }

    const [target] = await db
      .select()
      .from(productImages)
      .where(
        and(
          eq(productImages.id, imgId),
          eq(productImages.productId, productId)
        )
      )
      .limit(1);

    if (!target) {
      return apiError("Image not found", 404);
    }

    await db
      .update(productImages)
      .set({ isPrimary: false })
      .where(eq(productImages.productId, productId));

    const [updated] = await db
      .update(productImages)
      .set({ isPrimary: true })
      .where(eq(productImages.id, imgId))
      .returning();

    return apiSuccess("Primary image updated", updated);
  } catch (err) {
    console.error("Set primary image error:", err);
    return apiError("Failed to set primary image", 500);
  }
}
