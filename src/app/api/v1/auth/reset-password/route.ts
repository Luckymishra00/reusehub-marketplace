import { NextRequest } from "next/server";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import {
  apiError,
  apiSuccess,
  hashPassword,
  hashResetToken,
} from "@/lib/auth";
import { and, eq, isNull } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = String(body.token || "").trim();
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword ?? body.password ?? "");

    const errors: Array<{ field: string; message: string }> = [];
    if (!token) {
      errors.push({ field: "token", message: "Reset token is required" });
    }
    if (!password || password.length < 8) {
      errors.push({
        field: "password",
        message: "New password must be at least 8 characters",
      });
    }
    if (password !== confirmPassword) {
      errors.push({
        field: "confirmPassword",
        message: "Passwords do not match",
      });
    }
    if (errors.length > 0) {
      return apiError("Validation failed", 400, errors);
    }

    const tokenHash = hashResetToken(token);
    const [resetRecord] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt)
        )
      )
      .limit(1);

    if (!resetRecord) {
      return apiError("Invalid or already used password reset token", 400);
    }

    if (new Date(resetRecord.expiresAt).getTime() < Date.now()) {
      return apiError("Password reset token has expired", 400);
    }

    const newPasswordHash = await hashPassword(password);

    await db
      .update(users)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(users.id, resetRecord.userId));

    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetRecord.id));

    return apiSuccess(
      "Password has been reset successfully. You may now sign in with your new password.",
      null
    );
  } catch (err) {
    console.error("Reset password error:", err);
    return apiError("Failed to reset password", 500);
  }
}
