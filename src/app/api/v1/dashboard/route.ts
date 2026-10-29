import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  conversations,
  favorites,
  messages,
  products,
  users,
} from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { apiError, apiSuccess, getAuthenticatedUser } from "@/lib/auth";
import { hydrateProducts } from "@/lib/products-helper";
import { and, count, desc, eq, inArray, isNull, ne, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }

    // 1. User's listings
    const myProducts = await db
      .select()
      .from(products)
      .where(eq(products.sellerId, currentUser.id))
      .orderBy(desc(products.createdAt));

    const activeListingsCount = myProducts.filter(
      (p) => p.status === "Active"
    ).length;
    const soldListingsCount = myProducts.filter(
      (p) => p.status === "Sold"
    ).length;
    const reservedListingsCount = myProducts.filter(
      (p) => p.status === "Reserved"
    ).length;

    // 2. Favorites count
    const [favCountRow] = await db
      .select({ value: count() })
      .from(favorites)
      .where(eq(favorites.userId, currentUser.id));

    // 3. Conversations & unread messages
    const myConvs = await db
      .select()
      .from(conversations)
      .where(
        or(
          eq(conversations.buyerId, currentUser.id),
          eq(conversations.sellerId, currentUser.id)
        )
      )
      .orderBy(desc(conversations.updatedAt));

    let unreadMessagesCount = 0;
    const convIds = myConvs.map((c) => c.id);

    if (convIds.length > 0) {
      const [unreadRow] = await db
        .select({ value: count() })
        .from(messages)
        .where(
          and(
            inArray(messages.conversationId, convIds),
            ne(messages.senderId, currentUser.id),
            isNull(messages.readAt)
          )
        );
      unreadMessagesCount = unreadRow?.value ?? 0;
    }

    const recentListings = await hydrateProducts(
      myProducts.slice(0, 5),
      currentUser.id
    );

    // Hydrate recent conversations (top 4)
    const topConvs = myConvs.slice(0, 4);
    const otherUserIds = Array.from(
      new Set(
        topConvs.map((c) =>
          c.buyerId === currentUser.id ? c.sellerId : c.buyerId
        )
      )
    );
    const convProductIds = Array.from(
      new Set(topConvs.map((c) => c.productId))
    );

    const [otherUsers, convProducts] = await Promise.all([
      otherUserIds.length > 0
        ? db
            .select({
              id: users.id,
              fullName: users.fullName,
              profileImage: users.profileImage,
            })
            .from(users)
            .where(inArray(users.id, otherUserIds))
        : Promise.resolve([]),
      convProductIds.length > 0
        ? db
            .select({
              id: products.id,
              title: products.title,
              price: products.price,
              status: products.status,
            })
            .from(products)
            .where(inArray(products.id, convProductIds))
        : Promise.resolve([]),
    ]);

    const userMap = new Map(otherUsers.map((u) => [u.id, u]));
    const prodMap = new Map(convProducts.map((p) => [p.id, p]));

    const recentConversations = topConvs.map((c) => {
      const otherId = c.buyerId === currentUser.id ? c.sellerId : c.buyerId;
      return {
        id: c.id,
        updatedAt: c.updatedAt,
        otherUser: userMap.get(otherId) || null,
        product: prodMap.get(c.productId) || null,
      };
    });

    return apiSuccess("Dashboard overview retrieved", {
      stats: {
        activeListings: activeListingsCount,
        soldListings: soldListingsCount,
        reservedListings: reservedListingsCount,
        totalListings: myProducts.length,
        totalFavorites: favCountRow?.value ?? 0,
        unreadMessages: unreadMessagesCount,
      },
      recentListings,
      recentConversations,
    });
  } catch (err) {
    console.error("Dashboard overview error:", err);
    return apiError("Failed to load dashboard overview", 500);
  }
}
