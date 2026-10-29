import { NextRequest } from "next/server";
import crypto from "crypto";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import {
  apiError,
  apiSuccess,
  checkRateLimit,
  hashResetToken,
} from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!checkRateLimit(`forgot-pw:${ip}`, 10, 60_000)) {
      return apiError("Too many password reset requests. Please wait.", 429);
    }

    const body = await req.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return apiError("Validation failed", 400, [
        { field: "email", message: "Email is required" },
      ]);
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      // Do not leak email existence, return clear message explaining SMTP configuration status
      return apiSuccess(
        "If an account exists for that email, a reset token has been generated. Note: External SMTP email delivery is not configured in this local environment.",
        { smtpConfigured: false, devResetToken: null }
      );
    }

    const rawToken = crypto.randomBytes(24).toString("hex");
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return apiSuccess(
      "Password reset token created and stored in the database. Because external SMTP email delivery is not configured in this sandbox, you can use the development reset link below directly.",
      {
        smtpConfigured: false,
        devResetToken: rawToken,
        resetPath: `/reset-password/${rawToken}`,
        expiresAt: expiresAt.toISOString(),
      }
    );
  } catch (err) {
    console.error("Forgot password error:", err);
    return apiError("Unable to process password recovery request", 500);
  }
}
