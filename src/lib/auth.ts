import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET =
  process.env.JWT_ACCESS_SECRET ||
  process.env.DATABASE_URL ||
  "reusehub-production-hmac-secret-key-2026";

export const AUTH_COOKIE_NAME = "reusehub_token";

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface SafeUser {
  id: number;
  fullName: string;
  email: string;
  profileImage: string | null;
  bio: string | null;
  location: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function hashResetToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input: string): string {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

export function signToken(
  payload: { userId: number; email: string; role: string },
  expiresInSeconds = 60 * 60 * 24 * 7 // 7 days default session
): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${header}.${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, encodedPayload, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${encodedPayload}`)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    if (signature !== expectedSig) return null;
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JwtPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function toSafeUser(user: typeof users.$inferSelect): SafeUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    profileImage: user.profileImage,
    bio: user.bio,
    location: user.location,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getAuthenticatedUser(
  req?: NextRequest
): Promise<SafeUser | null> {
  try {
    let token: string | undefined;

    if (req) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7).trim();
      }
      if (!token) {
        token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
      }
    }

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    }

    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user || !user.isActive) return null;
    return toSafeUser(user);
  } catch {
    return null;
  }
}

// Simple in-memory rate limiter for auth & messaging endpoints
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests = 30,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count += 1;
  return true;
}

export function apiSuccess<T>(
  message: string,
  data: T,
  status = 200,
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      ...(pagination ? { pagination } : {}),
    },
    { status }
  );
}

export function apiError(
  message: string,
  status = 400,
  errors?: Array<{ field: string; message: string }>
) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(errors ? { errors } : {}),
    },
    { status }
  );
}
