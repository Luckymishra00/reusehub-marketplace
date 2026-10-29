import { NextRequest } from "next/server";
import { db } from "@/db";
import { products, reviews, users } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { apiError, apiSuccess, getAuthenticatedUser } from "@/lib/auth";
import { hydrateProducts } from "@/lib/products-helper";
import { and, avg, count, desc, eq, inArray } from "drizzle-orm";

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

    const [seller] = await db
      .select()
      .from(users)
      .where(eq(users.id, sellerId))
      .limit(1);

    if (!seller || !seller.isActive) {
      return apiError("Seller profile not found", 404);
    }

    // Active and Sold listings (never expose Draft or Archived to public)
    const sellerProductsRaw = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.sellerId, sellerId),
          inArray(products.status, ["Active", "Reserved", "Sold"])
        )
      )
      .orderBy(desc(products.createdAt));

    const hydratedProducts = await hydrateProducts(
      sellerProductsRaw,
      currentUser?.id
    );

    const [ratingSummary] = await db
      .select({
        avgRating: avg(reviews.rating),
        reviewCount: count(reviews.id),
      })
      .from(reviews)
      .where(eq(reviews.sellerId, sellerId));

    const rawReviews = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        isVerifiedExchange: reviews.isVerifiedExchange,
        createdAt: reviews.createdAt,
        productId: reviews.productId,
        reviewerId: reviews.reviewerId,
        reviewerName: users.fullName,
        reviewerAvatar: users.profileImage,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.reviewerId, users.id))
      .where(eq(reviews.sellerId, sellerId))
      .orderBy(desc(reviews.createdAt));

    // Notice we strictly omit email and passwordHash from public seller profile
    return apiSuccess("Seller profile retrieved", {
      profile: {
        id: seller.id,
        fullName: seller.fullName,
        profileImage: seller.profileImage,
        bio: seller.bio,
        location: seller.location,
        createdAt: seller.createdAt,
        ratingAverage: ratingSummary?.avgRating
          ? Number(Number(ratingSummary.avgRating).toFixed(1))
          : 5.0,
        reviewCount: ratingSummary?.reviewCount ?? 0,
        activeCount: hydratedProducts.filter((p) => p.status === "Active")
          .length,
        soldCount: hydratedProducts.filter((p) => p.status === "Sold").length,
      },
      products: hydratedProducts,
      reviews: rawReviews,
    });
  } catch (err) {
    console.error("Get seller profile error:", err);
    return apiError("Failed to load seller profile", 500);
  }
}
