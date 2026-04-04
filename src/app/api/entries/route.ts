import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { entries } from "@/db/schema";
import { desc, sql, and, eq, like, gte, lte } from "drizzle-orm";
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

  // Build conditions array
  const conditions = [eq(entries.userId, user.id)];

  // Time-range filter (week / month)
  if (filter === "week") {
    const start = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const end = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
    conditions.push(
      sql`(${entries.createdAt})::date >= ${start}::date AND (${entries.createdAt})::date <= ${end}::date`
    );
  } else if (filter === "month") {
    const start = format(startOfMonth(now), "yyyy-MM-dd");
    const end = format(endOfMonth(now), "yyyy-MM-dd");
    conditions.push(
      sql`(${entries.createdAt})::date >= ${start}::date AND (${entries.createdAt})::date <= ${end}::date`
    );
  }

  // Search by keyword (note)
  const q = sp.get("q")?.trim();
  if (q) {
    conditions.push(sql`LOWER(${entries.note}) LIKE ${"%" + q.toLowerCase() + "%"}`);
  }

  // Filter by category (comma-separated)
  const category = sp.get("category")?.trim();
  if (category) {
    const cats = category.split(",").map((c) => c.trim()).filter(Boolean);
    if (cats.length === 1) {
      conditions.push(eq(entries.category, cats[0]));
    } else if (cats.length > 1) {
      conditions.push(sql`${entries.category} IN (${sql.join(cats.map((c) => sql`${c}`), sql`, `)})`);
    }
  }

  // Filter by amount range
  const minAmount = sp.get("minAmount");
  const maxAmount = sp.get("maxAmount");
  if (minAmount && !isNaN(Number(minAmount))) {
    conditions.push(gte(entries.amount, Number(minAmount)));
  }
  if (maxAmount && !isNaN(Number(maxAmount))) {
    conditions.push(lte(entries.amount, Number(maxAmount)));
  }

  // Filter by date range (custom)
  const dateFrom = sp.get("dateFrom");
  const dateTo = sp.get("dateTo");
  if (dateFrom) {
    conditions.push(sql`(${entries.createdAt})::date >= ${dateFrom}::date`);
  }
  if (dateTo) {
    conditions.push(sql`(${entries.createdAt})::date <= ${dateTo}::date`);
  }

  const results = await db
    .select()
    .from(entries)
    .where(and(...conditions))
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
