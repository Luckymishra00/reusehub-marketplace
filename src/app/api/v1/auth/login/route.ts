import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import {
  apiError,
  apiSuccess,
  AUTH_COOKIE_NAME,
  checkRateLimit,
  signToken,
  toSafeUser,
  verifyPassword,
} from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!checkRateLimit(`login:${ip}`, 25, 60_000)) {
      return apiError("Too many login attempts. Please try again shortly.", 429);
    }

    const body = await req.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");

    const errors: Array<{ field: string; message: string }> = [];
    if (!email) {
      errors.push({ field: "email", message: "Email address is required" });
    }
    if (!password) {
      errors.push({ field: "password", message: "Password is required" });
    }
    if (errors.length > 0) {
      return apiError("Validation failed", 400, errors);
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return apiError("Invalid email or password", 401);
    }

    if (!user.isActive) {
      return apiError(
        "This account has been deactivated. Please contact support.",
        403
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return apiError("Invalid email or password", 401);
    }

    const safeUser = toSafeUser(user);
    const token = signToken({
      userId: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
    });

    const response = apiSuccess("Logged in successfully", {
      user: safeUser,
      token,
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return apiError("Unable to process login request", 500);
  }
}
