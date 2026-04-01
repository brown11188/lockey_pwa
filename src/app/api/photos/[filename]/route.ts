import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // The filename is either a UUID (new photos in DB) or an old filesystem name
    const photoId = filename.replace(/\.[a-zA-Z]+$/, ""); // strip any extension

    // Try to find in database by ID
    const photo = db
      .select({
        data: photos.data,
        mimeType: photos.mimeType,
        size: photos.size,
      })
      .from(photos)
      .where(eq(photos.id, photoId))
      .get();

    if (!photo) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(photo.data), {
      headers: {
        "Content-Type": photo.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(photo.size),
      },
    });
  } catch (err) {
    console.error("[photos] Error serving file:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
