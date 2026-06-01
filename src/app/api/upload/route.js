/**
 * GENERIC IMAGE UPLOAD API
 * ========================
 *
 * POST /api/upload - Upload a single image (e.g. user avatar)
 *
 * Form Data:
 * - file: File (required) — JPEG/PNG/WebP/GIF, max 5MB
 *
 * Saves to public/uploads/avatars and returns { success, url }.
 *
 * @requires Authentication
 */

import { NextResponse } from "next/server";
import { verifyAuth } from "../../../lib/auth";
import { isCloudinaryConfigured, uploadBufferToCloudinary } from "../../../lib/cloudinary";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");

export async function POST(request) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string" || file.size === 0) {
      return NextResponse.json(
        { success: false, message: "A file is required" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Prefer Cloudinary when configured; fall back to local disk for dev.
    if (isCloudinaryConfigured()) {
      const { url } = await uploadBufferToCloudinary(buffer, {
        folder: "quickcourt/avatars",
      });
      return NextResponse.json(
        { success: true, message: "Uploaded", url, data: { url } },
        { status: 201 }
      );
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = path.extname(file.name) || ".jpg";
    const filename = `${authResult.user.id}-${timestamp}-${random}${extension}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    await writeFile(filepath, buffer);

    const url = `/uploads/avatars/${filename}`;

    return NextResponse.json(
      { success: true, message: "Uploaded", url, data: { url } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload file" },
      { status: 500 }
    );
  }
}
