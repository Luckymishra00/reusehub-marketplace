import { NextRequest } from "next/server";
import { db } from "@/db";
import { favorites, products } from "@/db/schema";
import { apiError, apiSuccess, getAuthenticatedUser } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError("Authentication required to save favorites", 401);
    }

    const { productId } = await context.params;
    const pid = Number(productId);
    if (Number.isNaN(pid) || pid <= 0) {
      return apiError("Invalid product ID", 400);
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, pid))
      .limit(1);

    if (!product) {
      return apiError("Product not found", 404);
    }

    if (product.sellerId === currentUser.id) {
      return apiError("You cannot favorite your own listing", 400);
    }

    const existing = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, currentUser.id),
          eq(favorites.productId, pid)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return apiSuccess("Product is already in your favorites", {
        productId: pid,
        isFavorited: true,
      });
    }

    await db.insert(favorites).values({
      userId: currentUser.id,
      productId: pid,
    });

    return apiSuccess(
      "Added to favorites",
      { productId: pid, isFavorited: true },
      201
    );
  } catch (err) {
    console.error("Add favorite error:", err);
    return apiError("Failed to add favorite", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }

    const { productId } = await context.params;
    const pid = Number(productId);
    if (Number.isNaN(pid) || pid <= 0) {
      return apiError("Invalid product ID", 400);
    }

    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, currentUser.id),
          eq(favorites.productId, pid)
        )
      );

    return apiSuccess("Removed from favorites", {
      productId: pid,
      isFavorited: false,
    });
  } catch (err) {
    console.error("Remove favorite error:", err);
    return apiError("Failed to remove favorite", 500);
  }
}
