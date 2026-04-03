import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, user.id));
  const obj: Record<string, string> = {};
  for (const row of rows) {
    obj[row.key] = row.value;
  }
  return NextResponse.json(obj, {
    headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' },
  });
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json();
  const { key, value } = body;

  if (!key || value == null) {
    return NextResponse.json({ error: "key and value required" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(settings)
    .where(and(eq(settings.key, key), eq(settings.userId, user.id)))
    .limit(1);

  if (existing) {
    await db
      .update(settings)
      .set({ value })
      .where(and(eq(settings.key, key), eq(settings.userId, user.id)));
  } else {
    await db.insert(settings).values({ key, userId: user.id, value });
  }

  return NextResponse.json({ success: true });
}
