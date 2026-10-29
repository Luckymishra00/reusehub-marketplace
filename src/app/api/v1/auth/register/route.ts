import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import {
  apiError,
  apiSuccess,
  AUTH_COOKIE_NAME,
  checkRateLimit,
  hashPassword,
  signToken,
  toSafeUser,
} from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!checkRateLimit(`register:${ip}`, 15, 60_000)) {
      return apiError("Too many registration attempts. Please wait a minute.", 429);
    }

    const body = await req.json();
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword ?? body.password ?? "");
    const location = body.location ? String(body.location).trim() : null;
    const acceptTerms = Boolean(body.acceptTerms);

    const errors: Array<{ field: string; message: string }> = [];

    if (!fullName || fullName.length < 2) {
      errors.push({
        field: "fullName",
        message: "Full name must be at least 2 characters",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      errors.push({
        field: "email",
        message: "Please provide a valid email address",
      });
    }

    if (!password || password.length < 8) {
      errors.push({
        field: "password",
        message: "Password must be at least 8 characters long",
      });
    }

    if (password !== confirmPassword) {
      errors.push({
        field: "confirmPassword",
        message: "Passwords do not match",
      });
    }

    if (!acceptTerms) {
      errors.push({
        field: "acceptTerms",
        message: "You must accept the Terms & Conditions",
      });
    }

    if (errors.length > 0) {
      return apiError("Validation failed", 400, errors);
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return apiError("An account with this email already exists", 409, [
        { field: "email", message: "Email address is already registered" },
      ]);
    }

    const passwordHash = await hashPassword(password);

    const [createdUser] = await db
      .insert(users)
      .values({
        fullName,
        email,
        passwordHash,
        location: location || "Portland, OR",
        bio: "New member of the ReUseHub sustainable exchange community.",
        role: "user",
        isActive: true,
      })
      .returning();

    const safeUser = toSafeUser(createdUser);
    const token = signToken({
      userId: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
    });

    const response = apiSuccess(
      "Account registered successfully",
      { user: safeUser, token },
      201
    );

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error("Register error:", err);
    return apiError("Unable to complete registration", 500);
  }
}
