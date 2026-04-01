import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { entries } from "@/db/schema";
import { desc, sql, and, eq } from "drizzle-orm";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const sp = req.nextUrl.searchParams;
  const filter = sp.get("filter") ?? "all";
  const now = new Date();
  const userFilter = eq(entries.userId, user.id);

  if (filter === "week") {
    const start = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const end = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const results = await db
      .select()
      .from(entries)
      .where(
        and(
          userFilter,
          sql`(${entries.createdAt})::date >= ${start}::date AND (${entries.createdAt})::date <= ${end}::date`
        )
      )
      .orderBy(desc(entries.createdAt));
    return NextResponse.json(results);
  }

  if (filter === "month") {
    const start = format(startOfMonth(now), "yyyy-MM-dd");
    const end = format(endOfMonth(now), "yyyy-MM-dd");
    const results = await db
      .select()
      .from(entries)
      .where(
        and(
          userFilter,
          sql`(${entries.createdAt})::date >= ${start}::date AND (${entries.createdAt})::date <= ${end}::date`
        )
      )
      .orderBy(desc(entries.createdAt));
    return NextResponse.json(results);
  }

  // "all" filter
  const results = await db
    .select()
    .from(entries)
    .where(userFilter)
    .orderBy(desc(entries.createdAt));
  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json();
  const { photoUri, photoId, amount, currency, category, note, createdAt } = body;

  if (amount == null || !category) {
    return NextResponse.json(
      { error: "Missing required fields (amount, category)" },
      { status: 400 }
    );
  }

  const result = await db.insert(entries).values({
    userId: user.id,
    photoId: photoId || null,
    photoUri: photoUri || (photoId ? `/api/photos/${photoId}` : null),
    amount: parseFloat(amount),
    currency: currency || "VND",
    category,
    note: note || "",
    createdAt: createdAt || new Date().toISOString(),
  }).returning({ id: entries.id });

  return NextResponse.json({ id: result[0].id }, { status: 201 });
}
