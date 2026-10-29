import { NextRequest } from "next/server";
import { db } from "@/db";
import { productImages, products } from "@/db/schema";
import { apiError, apiSuccess, getAuthenticatedUser } from "@/lib/auth";
import { asc, eq } from "drizzle-orm";

export async function POST(
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

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return apiError("Listing not found", 404);
    }

    if (product.sellerId !== currentUser.id && currentUser.role !== "admin") {
      return apiError("You can only upload images to your own listings", 403);
    }

    const existingImages = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(asc(productImages.sortOrder));

    if (existingImages.length >= 5) {
      return apiError("Maximum of 5 images allowed per listing", 400);
    }

    const body = await req.json();
    const imageUrl = String(body.imageUrl || "").trim();
    if (!imageUrl) {
      return apiError("Image URL is required", 400);
    }

    const [inserted] = await db
      .insert(productImages)
      .values({
        productId,
        imageUrl,
        altText: body.altText || product.title,
        isPrimary: existingImages.length === 0,
        sortOrder: existingImages.length,
      })
      .returning();

    return apiSuccess("Image added to listing", inserted, 201);
  } catch (err) {
    console.error("Add product image error:", err);
    return apiError("Failed to add image to listing", 500);
  }
}
