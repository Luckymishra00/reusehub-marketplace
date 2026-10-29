import { NextRequest } from "next/server";
import { db } from "@/db";
import { products, users } from "@/db/schema";
import {
  apiError,
  apiSuccess,
  AUTH_COOKIE_NAME,
  getAuthenticatedUser,
  toSafeUser,
} from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }

    const body = await req.json();
    const fullName =
      body.fullName !== undefined
        ? String(body.fullName).trim()
        : currentUser.fullName;
    const bio =
      body.bio !== undefined
        ? body.bio
          ? String(body.bio).trim()
          : null
        : currentUser.bio;
    const location =
      body.location !== undefined
        ? body.location
          ? String(body.location).trim()
          : null
        : currentUser.location;
    const profileImage =
      body.profileImage !== undefined
        ? body.profileImage
          ? String(body.profileImage).trim()
          : null
        : currentUser.profileImage;

    if (!fullName || fullName.length < 2) {
      return apiError("Validation failed", 400, [
        {
          field: "fullName",
          message: "Full name must be at least 2 characters",
        },
      ]);
    }

    const [updated] = await db
      .update(users)
      .set({
        fullName,
        bio,
        location,
        profileImage,
        updatedAt: new Date(),
      })
      .where(eq(users.id, currentUser.id))
      .returning();

    return apiSuccess("Profile updated successfully", {
      user: toSafeUser(updated),
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return apiError("Failed to update profile", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }

    // Deactivate user and archive their active listings safely
    await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, currentUser.id));

    await db
      .update(products)
      .set({ status: "Archived", updatedAt: new Date() })
      .where(eq(products.sellerId, currentUser.id));

    const response = apiSuccess("Account deactivated and listings archived", null);
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (err) {
    console.error("Deactivate account error:", err);
    return apiError("Failed to deactivate account", 500);
  }
}
