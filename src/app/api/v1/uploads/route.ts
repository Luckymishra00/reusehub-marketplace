import { NextRequest } from "next/server";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { apiError, apiSuccess, getAuthenticatedUser } from "@/lib/auth";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_MB = Number(process.env.MAX_UPLOAD_SIZE_MB || "5");
const MAX_BYTES = MAX_MB * 1024 * 1024;

function validateMagicBytes(buffer: Buffer, ext: string): boolean {
  if (buffer.length < 12) return false;
  if (ext === "jpg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (ext === "png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }
  if (ext === "webp") {
    const riff = buffer.subarray(0, 4).toString("ascii");
    const webp = buffer.subarray(8, 12).toString("ascii");
    return riff === "RIFF" && webp === "WEBP";
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError("Authentication required to upload images", 401);
    }

    const formData = await req.formData();
    const files = formData.getAll("images");
    const singleFile = formData.get("image");
    const allFiles: File[] = [];

    for (const item of files) {
      if (item instanceof File) allFiles.push(item);
    }
    if (singleFile instanceof File) {
      allFiles.push(singleFile);
    }

    if (allFiles.length === 0) {
      return apiError("No image files provided in upload request", 400);
    }

    if (allFiles.length > 5) {
      return apiError("You can upload at most 5 images per listing", 400);
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const uploadedUrls: string[] = [];

    for (const file of allFiles) {
      const ext = ALLOWED_TYPES[file.type];
      if (!ext) {
        return apiError(
          `Unsupported file format (${file.type || "unknown"}). Allowed formats: JPEG, PNG, WebP.`,
          400
        );
      }

      if (file.size > MAX_BYTES) {
        return apiError(
          `File "${file.name}" exceeds the ${MAX_MB}MB maximum size limit.`,
          413
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (!validateMagicBytes(buffer, ext)) {
        return apiError(
          "Uploaded file content does not match a valid JPEG, PNG, or WebP image.",
          400
        );
      }

      const safeFilename = `${crypto.randomUUID()}.${ext}`;
      const filePath = path.join(uploadDir, safeFilename);
      await fs.writeFile(filePath, buffer);
      uploadedUrls.push(`/uploads/${safeFilename}`);
    }

    return apiSuccess(
      "Images uploaded successfully",
      { urls: uploadedUrls },
      201
    );
  } catch (err) {
    console.error("Image upload error:", err);
    return apiError("Failed to process image upload", 500);
  }
}
