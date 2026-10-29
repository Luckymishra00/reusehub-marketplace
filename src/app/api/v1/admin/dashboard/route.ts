import { NextRequest } from "next/server";
import { db } from "@/db";
import { contactMessages, products, users } from "@/db/schema";
import { apiError, apiSuccess, getAuthenticatedUser } from "@/lib/auth";
import { count, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }
    if (currentUser.role !== "admin") {
      return apiError("Administrator privileges required", 403);
    }

    const [[userCount], [productCount], [contactCount], recentContacts] =
      await Promise.all([
        db.select({ value: count() }).from(users),
        db.select({ value: count() }).from(products),
        db.select({ value: count() }).from(contactMessages),
        db
          .select()
          .from(contactMessages)
          .orderBy(desc(contactMessages.createdAt))
          .limit(10),
      ]);

    return apiSuccess("Admin dashboard metrics retrieved", {
      totalUsers: userCount?.value ?? 0,
      totalProducts: productCount?.value ?? 0,
      totalContactMessages: contactCount?.value ?? 0,
      recentContacts,
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    return apiError("Failed to retrieve admin dashboard", 500);
  }
}
