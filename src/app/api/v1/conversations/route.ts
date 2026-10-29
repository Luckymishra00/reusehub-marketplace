import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  conversations,
  messages,
  productImages,
  products,
  users,
} from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import {
  apiError,
  apiSuccess,
  checkRateLimit,
  getAuthenticatedUser,
} from "@/lib/auth";
import { and, asc, desc, eq, inArray, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError("Authentication required to view conversations", 401);
    }

    const convRows = await db
      .select()
      .from(conversations)
      .where(
        or(
          eq(conversations.buyerId, currentUser.id),
          eq(conversations.sellerId, currentUser.id)
        )
      )
      .orderBy(desc(conversations.updatedAt));

    if (convRows.length === 0) {
      return apiSuccess("Conversations retrieved", []);
    }

    const convIds = convRows.map((c) => c.id);
    const productIds = Array.from(new Set(convRows.map((c) => c.productId)));
    const userIds = Array.from(
      new Set(convRows.flatMap((c) => [c.buyerId, c.sellerId]))
    );

    const [allMsgs, allProducts, allProductImages, allUsers] =
      await Promise.all([
        db
          .select()
          .from(messages)
          .where(inArray(messages.conversationId, convIds))
          .orderBy(asc(messages.createdAt)),
        db.select().from(products).where(inArray(products.id, productIds)),
        db
          .select()
          .from(productImages)
          .where(inArray(productImages.productId, productIds))
          .orderBy(asc(productImages.sortOrder)),
        db
          .select({
            id: users.id,
            fullName: users.fullName,
            profileImage: users.profileImage,
            location: users.location,
          })
          .from(users)
          .where(inArray(users.id, userIds)),
      ]);

    const productMap = new Map(allProducts.map((p) => [p.id, p]));
    const imageMap = new Map<number, string>();
    for (const img of allProductImages) {
      if (!imageMap.has(img.productId) || img.isPrimary) {
        imageMap.set(img.productId, img.imageUrl);
      }
    }
    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    const msgsByConv = new Map<
      number,
      Array<typeof messages.$inferSelect>
    >();
    for (const m of allMsgs) {
      const list = msgsByConv.get(m.conversationId) || [];
      list.push(m);
      msgsByConv.set(m.conversationId, list);
    }

    const enriched = convRows.map((conv) => {
      const convMsgs = msgsByConv.get(conv.id) || [];
      const lastMsg = convMsgs[convMsgs.length - 1] || null;
      const unreadCount = convMsgs.filter(
        (m) => m.senderId !== currentUser.id && !m.readAt
      ).length;
      const otherUserId =
        conv.buyerId === currentUser.id ? conv.sellerId : conv.buyerId;
      const otherUser = userMap.get(otherUserId) || null;
      const prod = productMap.get(conv.productId);

      return {
        ...conv,
        otherUser,
        roleInConversation:
          conv.buyerId === currentUser.id ? "buyer" : "seller",
        product: prod
          ? {
              id: prod.id,
              title: prod.title,
              price: Number(prod.price),
              status: prod.status,
              condition: prod.condition,
              primaryImage:
                imageMap.get(prod.id) || "/images/placeholder-product.svg",
            }
          : null,
        lastMessage: lastMsg,
        unreadCount,
      };
    });

    return apiSuccess("Conversations retrieved successfully", enriched);
  } catch (err) {
    console.error("Get conversations error:", err);
    return apiError("Failed to retrieve conversations", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError("Authentication required to message a seller", 401);
    }

    if (!checkRateLimit(`conv-create:${currentUser.id}`, 20, 60_000)) {
      return apiError("Too many requests. Please slow down.", 429);
    }

    const body = await req.json();
    const productId = Number(body.productId);
    const initialMessage = String(body.message || "").trim();

    if (Number.isNaN(productId) || productId <= 0) {
      return apiError("Valid productId is required", 400);
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return apiError("Product listing not found", 404);
    }

    if (product.sellerId === currentUser.id) {
      return apiError("You cannot start a conversation with yourself", 400);
    }

    // Check if conversation already exists for this buyer, seller, and product
    const [existing] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.productId, productId),
          eq(conversations.buyerId, currentUser.id),
          eq(conversations.sellerId, product.sellerId)
        )
      )
      .limit(1);

    let conversation = existing;

    if (!conversation) {
      const [created] = await db
        .insert(conversations)
        .values({
          productId,
          buyerId: currentUser.id,
          sellerId: product.sellerId,
        })
        .returning();
      conversation = created;
    }

    if (initialMessage) {
      if (initialMessage.length > 2000) {
        return apiError("Message cannot exceed 2000 characters", 400);
      }
      await db.insert(messages).values({
        conversationId: conversation.id,
        senderId: currentUser.id,
        messageText: initialMessage,
      });
      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, conversation.id));
    }

    return apiSuccess(
      "Conversation ready",
      { conversationId: conversation.id, conversation },
      existing ? 200 : 201
    );
  } catch (err) {
    console.error("Create conversation error:", err);
    return apiError("Failed to start conversation", 500);
  }
}
