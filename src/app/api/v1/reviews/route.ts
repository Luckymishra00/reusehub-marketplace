import { NextRequest } from "next/server";
import { db } from "@/db";
import { conversations, reviews, users } from "@/db/schema";
import { apiError, apiSuccess, getAuthenticatedUser } from "@/lib/auth";
import { and, eq, or } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError("Authentication required to leave a review", 401);
    }

    const body = await req.json();
    const sellerId = Number(body.sellerId);
    const productId = body.productId ? Number(body.productId) : null;
    const rating = Number(body.rating);
    const comment = String(body.comment || "").trim();

    const errors: Array<{ field: string; message: string }> = [];

    if (Number.isNaN(sellerId) || sellerId <= 0) {
      errors.push({ field: "sellerId", message: "Valid seller is required" });
    }
    if (sellerId === currentUser.id) {
      return apiError("You cannot review yourself", 400);
    }
    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
      errors.push({
        field: "rating",
        message: "Rating must be an integer between 1 and 5",
      });
    }
    if (!comment || comment.length < 8) {
      errors.push({
        field: "comment",
        message: "Review comment must be at least 8 characters",
      });
    }

    if (errors.length > 0) {
      return apiError("Validation failed", 400, errors);
    }

    const [seller] = await db
      .select()
      .from(users)
      .where(eq(users.id, sellerId))
      .limit(1);

    if (!seller) {
      return apiError("Seller not found", 404);
    }

    // Check if duplicate review exists from this reviewer for this seller
    const existingReviews = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.reviewerId, currentUser.id),
          eq(reviews.sellerId, sellerId)
        )
      );

    if (
      existingReviews.some(
        (r) => r.productId === productId || (!productId && existingReviews.length > 0)
      )
    ) {
      return apiError(
        "You have already submitted feedback for this seller/exchange",
        409
      );
    }

    // Check if an active conversation exists between reviewer and seller to label verified communication vs community feedback
    const convInteraction = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(
            eq(conversations.buyerId, currentUser.id),
            eq(conversations.sellerId, sellerId)
          ),
          and(
            eq(conversations.sellerId, currentUser.id),
            eq(conversations.buyerId, sellerId)
          )
        )
      )
      .limit(1);

    const isVerifiedExchange = convInteraction.length > 0;

    const [created] = await db
      .insert(reviews)
      .values({
        reviewerId: currentUser.id,
        sellerId,
        productId,
        rating: Math.round(rating),
        comment,
        isVerifiedExchange,
      })
      .returning();

    return apiSuccess(
      "Review submitted successfully",
      {
        ...created,
        reviewerName: currentUser.fullName,
        reviewerAvatar: currentUser.profileImage,
      },
      201
    );
  } catch (err) {
    console.error("Create review error:", err);
    return apiError("Failed to submit review", 500);
  }
}
