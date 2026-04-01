import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos } from "@/db/schema";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  try {
    const formData = await req.formData();
    const file = formData.get("photo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const mimeType = file.type || "image/jpeg";
    if (!ALLOWED_MIME_TYPES[mimeType]) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await db.insert(photos).values({
      userId: user.id,
      data: buffer,
      mimeType,
      size: buffer.byteLength,
    }).returning({ id: photos.id });

    const photoId = result[0].id;

    return NextResponse.json({ 
      photoId,
      uri: `/api/photos/${photoId}`,
    });
  } catch (err) {
    console.error("[upload] Error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
