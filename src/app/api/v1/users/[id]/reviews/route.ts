import { NextRequest } from "next/server";
import { db } from "@/db";
import { reviews, users } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { apiError, apiSuccess } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSeeded();
    const { id } = await context.params;
    const sellerId = Number(id);
    if (Number.isNaN(sellerId) || sellerId <= 0) {
      return apiError("Invalid user ID", 400);
    }

    const rows = await db
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

    return apiSuccess("Seller reviews retrieved", rows);
  } catch (err) {
    console.error("Get seller reviews error:", err);
    return apiError("Failed to retrieve reviews", 500);
  }
}
