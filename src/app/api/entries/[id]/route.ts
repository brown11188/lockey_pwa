import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { entries, photos } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const entry = db
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.id, parseInt(id, 10)),
        eq(entries.userId, user.id)
      )
    )
    .get();

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(entry);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const entry = db
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.id, parseInt(id, 10)),
        eq(entries.userId, user.id)
      )
    )
    .get();

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete the photo from database if it exists
  if (entry.photoId) {
    await db.delete(photos).where(eq(photos.id, entry.photoId));
  }

  await db.delete(entries).where(
    and(
      eq(entries.id, parseInt(id, 10)),
      eq(entries.userId, user.id)
    )
  );
  return NextResponse.json({ success: true });
}
