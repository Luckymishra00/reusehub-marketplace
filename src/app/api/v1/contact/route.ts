import { NextRequest } from "next/server";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { apiError, apiSuccess, checkRateLimit } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    if (!checkRateLimit(`contact:${ip}`, 10, 60_000)) {
      return apiError("Too many messages submitted. Please wait a minute.", 429);
    }

    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();

    const errors: Array<{ field: string; message: string }> = [];

    if (!name || name.length < 2) {
      errors.push({ field: "name", message: "Please provide your name" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      errors.push({
        field: "email",
        message: "Please provide a valid email address",
      });
    }
    if (!subject || subject.length < 3) {
      errors.push({
        field: "subject",
        message: "Subject must be at least 3 characters",
      });
    }
    if (!message || message.length < 10) {
      errors.push({
        field: "message",
        message: "Message must be at least 10 characters",
      });
    }

    if (errors.length > 0) {
      return apiError("Validation failed", 400, errors);
    }

    const [saved] = await db
      .insert(contactMessages)
      .values({
        name,
        email,
        subject,
        message,
        status: "new",
      })
      .returning();

    return apiSuccess(
      "Thank you for reaching out! Your message has been saved and our team will respond shortly.",
      saved,
      201
    );
  } catch (err) {
    console.error("Contact submission error:", err);
    return apiError("Failed to submit contact form", 500);
  }
}
