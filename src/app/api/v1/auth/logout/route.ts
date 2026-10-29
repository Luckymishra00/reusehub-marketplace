import { apiSuccess, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const response = apiSuccess("Logged out successfully", null);
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
