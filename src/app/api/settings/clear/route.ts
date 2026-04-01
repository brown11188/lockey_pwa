import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { entries, photos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  // Delete user's photos from database
  await db.delete(photos).where(eq(photos.userId, user.id));

  // Delete user's entries
  await db.delete(entries).where(eq(entries.userId, user.id));

  return NextResponse.json({ success: true });
}
