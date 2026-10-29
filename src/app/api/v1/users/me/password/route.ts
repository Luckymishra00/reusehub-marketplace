import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  apiError,
  apiSuccess,
  getAuthenticatedUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError("Authentication required", 401);
    }

    const body = await req.json();
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");
    const confirmPassword = String(
      body.confirmPassword ?? body.newPassword ?? ""
    );

    const errors: Array<{ field: string; message: string }> = [];
    if (!currentPassword) {
      errors.push({
        field: "currentPassword",
        message: "Current password is required",
      });
    }
    if (!newPassword || newPassword.length < 8) {
      errors.push({
        field: "newPassword",
        message: "New password must be at least 8 characters long",
      });
    }
    if (newPassword !== confirmPassword) {
      errors.push({
        field: "confirmPassword",
        message: "New passwords do not match",
      });
    }

    if (errors.length > 0) {
      return apiError("Validation failed", 400, errors);
    }

    const [userRow] = await db
      .select()
      .from(users)
      .where(eq(users.id, currentUser.id))
      .limit(1);

    if (!userRow) {
      return apiError("User account not found", 404);
    }

    const isMatch = await verifyPassword(currentPassword, userRow.passwordHash);
    if (!isMatch) {
      return apiError("Current password is incorrect", 400, [
        {
          field: "currentPassword",
          message: "Current password is incorrect",
        },
      ]);
    }

    const newHash = await hashPassword(newPassword);
    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, currentUser.id));

    return apiSuccess("Password changed successfully", null);
  } catch (err) {
    console.error("Change password error:", err);
    return apiError("Failed to update password", 500);
  }
}
