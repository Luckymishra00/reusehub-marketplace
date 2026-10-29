import { NextRequest } from "next/server";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { apiError, apiSuccess, getAuthenticatedUser } from "@/lib/auth";
import { and, eq, isNull, ne } from "drizzle-orm";

export async function PATCH(
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

    return apiSuccess("Messages marked as read", { conversationId: convId });
  } catch (err) {
    console.error("Mark read error:", err);
    return apiError("Failed to mark messages as read", 500);
  }
}
