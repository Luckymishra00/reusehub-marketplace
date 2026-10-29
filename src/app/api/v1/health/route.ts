import { db } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { apiError, apiSuccess } from "@/lib/auth";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    await ensureSeeded();
    return apiSuccess("ReUseHub API is healthy and database is connected", {
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return apiError("Database connectivity check failed", 500);
  }
}
