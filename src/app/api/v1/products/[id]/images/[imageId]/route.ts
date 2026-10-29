import { NextRequest } from "next/server";
import { db } from "@/db";
import { productImages, products } from "@/db/schema";
import { apiError, apiSuccess, getAuthenticatedUser } from "@/lib/auth";
import { and, asc, eq } from "drizzle-orm";

export async function DELETE(
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
      return apiError("Forbidden: Cannot delete another seller's image", 403);
    }

    const [img] = await db
      .select()
      .from(productImages)
      .where(
        and(
          eq(productImages.id, imgId),
          eq(productImages.productId, productId)
        )
      )
      .limit(1);

    if (!img) {
      return apiError("Image not found on this listing", 404);
    }

    await db.delete(productImages).where(eq(productImages.id, imgId));

    // Ensure at least one remaining image is marked primary
    const remaining = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(asc(productImages.sortOrder));

    if (remaining.length > 0 && !remaining.some((r) => r.isPrimary)) {
      await db
        .update(productImages)
        .set({ isPrimary: true })
        .where(eq(productImages.id, remaining[0].id));
    }

    return apiSuccess("Image removed from listing", { id: imgId });
  } catch (err) {
    console.error("Delete product image error:", err);
    return apiError("Failed to delete image", 500);
  }
}
