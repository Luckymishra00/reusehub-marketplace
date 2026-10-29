import { NextRequest } from "next/server";
import { ensureSeeded } from "@/db/seed";
import { apiError, apiSuccess, getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await ensureSeeded();
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return apiError("Not authenticated", 401);
  }
  return apiSuccess("Current user profile retrieved", { user });
}
