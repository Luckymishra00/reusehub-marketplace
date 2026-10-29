import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  conversations,
  messages,
  productImages,
  products,
  users,
} from "@/db/schema";
import {
  apiError,
  apiSuccess,
  checkRateLimit,
  getAuthenticatedUser,
} from "@/lib/auth";
import { and, asc, eq, isNull, ne } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }

    const { id } = await context.params;
    const convId = Number(id);
    if (Number.isNaN(convId) || convId <= 0) {
      return apiError("Invalid conversation ID", 400);
    }

    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, convId))
      .limit(1);

    if (!conv) {
      return apiError("Conversation not found", 404);
    }

    if (
      conv.buyerId !== currentUser.id &&
      conv.sellerId !== currentUser.id
    ) {
      return apiError(
        "Forbidden: You are not a participant in this conversation",
        403
      );
    }

    // Mark incoming unread messages as read
    await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(messages.conversationId, convId),
          ne(messages.senderId, currentUser.id),
          isNull(messages.readAt)
        )
      );

    const msgRows = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        messageText: messages.messageText,
        readAt: messages.readAt,
        createdAt: messages.createdAt,
        senderName: users.fullName,
        senderAvatar: users.profileImage,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, convId))
      .orderBy(asc(messages.createdAt));

    const [prod] = await db
      .select()
      .from(products)
      .where(eq(products.id, conv.productId))
      .limit(1);

    const imgs = prod
      ? await db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, prod.id))
          .orderBy(asc(productImages.sortOrder))
      : [];

    const otherUserId =
      conv.buyerId === currentUser.id ? conv.sellerId : conv.buyerId;
    const [otherUser] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        profileImage: users.profileImage,
        location: users.location,
      })
      .from(users)
      .where(eq(users.id, otherUserId))
      .limit(1);

    return apiSuccess("Messages retrieved", {
      conversation: {
        ...conv,
        otherUser: otherUser || null,
        product: prod
          ? {
              id: prod.id,
              title: prod.title,
              price: Number(prod.price),
              status: prod.status,
              condition: prod.condition,
              location: prod.location,
              primaryImage:
                imgs[0]?.imageUrl || "/images/placeholder-product.svg",
            }
          : null,
      },
      messages: msgRows,
    });
  } catch (err) {
    console.error("Get messages error:", err);
    return apiError("Failed to retrieve messages", 500);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }

    if (!checkRateLimit(`msg-send:${currentUser.id}`, 45, 60_000)) {
      return apiError("Message rate limit exceeded. Please wait briefly.", 429);
    }

    const { id } = await context.params;
    const convId = Number(id);
    if (Number.isNaN(convId) || convId <= 0) {
      return apiError("Invalid conversation ID", 400);
    }

    const [conv] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, convId))
      .limit(1);

    if (!conv) {
      return apiError("Conversation not found", 404);
    }

    if (
      conv.buyerId !== currentUser.id &&
      conv.sellerId !== currentUser.id
    ) {
      return apiError(
        "Forbidden: You are not a participant in this conversation",
        403
      );
    }

    const body = await req.json();
    const messageText = String(body.messageText || body.message || "").trim();

    if (!messageText) {
      return apiError("Validation failed", 400, [
        { field: "messageText", message: "Message cannot be empty" },
      ]);
    }

    if (messageText.length > 2000) {
      return apiError("Validation failed", 400, [
        {
          field: "messageText",
          message: "Message cannot exceed 2000 characters",
        },
      ]);
    }

    const [created] = await db
      .insert(messages)
      .values({
        conversationId: convId,
        senderId: currentUser.id, // Always derived from authenticated user!
        messageText,
      })
      .returning();

    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, convId));

    return apiSuccess(
      "Message sent",
      {
        ...created,
        senderName: currentUser.fullName,
        senderAvatar: currentUser.profileImage,
      },
      201
    );
  } catch (err) {
    console.error("Send message error:", err);
    return apiError("Failed to send message", 500);
  }
}
