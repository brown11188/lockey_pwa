import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { entries, photos } from "@/db/schema";
import { desc, sql, and, eq, gte, lte } from "drizzle-orm";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

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
      sql`date(${entries.createdAt}) >= ${start} AND date(${entries.createdAt}) <= ${end}`
    );
  } else if (filter === "month") {
    const start = format(startOfMonth(now), "yyyy-MM-dd");
    const end = format(endOfMonth(now), "yyyy-MM-dd");
    conditions.push(
      sql`date(${entries.createdAt}) >= ${start} AND date(${entries.createdAt}) <= ${end}`
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
    conditions.push(sql`date(${entries.createdAt}) >= ${dateFrom}`);
  }
  if (dateTo) {
    conditions.push(sql`date(${entries.createdAt}) <= ${dateTo}`);
  }

  const results = await db
    .select()
    .from(entries)
    .where(and(...conditions))
    .orderBy(desc(entries.createdAt));

  return NextResponse.json(results);
}

/**
 * POST /api/entries
 * Accepts both JSON (quick-add) and multipart FormData (photo + entry in one call).
 * Combining upload + entry creation into a single API call eliminates one extra
 * round-trip and one extra JWT decode, saving ~300-500ms.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const contentType = req.headers.get("content-type") ?? "";

  // ── Multipart: photo + entry combined in one request ──────────────
  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await req.formData();
      const file = formData.get("photo") as File | null;
      const amount = formData.get("amount") as string | null;
      const categoryVal = formData.get("category") as string | null;
      const currency = (formData.get("currency") as string) || "VND";
      const note = (formData.get("note") as string) || "";
      const createdAt = (formData.get("createdAt") as string) || new Date().toISOString();

      if (amount == null || !categoryVal) {
        return NextResponse.json(
          { error: "Missing required fields (amount, category)" },
          { status: 400 }
        );
      }

      let photoId: string | null = null;
      let photoUri: string | null = null;

      if (file && file.size > 0) {
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
        }
        const mimeType = file.type || "image/jpeg";
        if (!ALLOWED_MIME_TYPES[mimeType]) {
          return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
        }
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const photoResult = await db.insert(photos).values({
          userId: user.id,
          data: buffer,
          mimeType,
          size: buffer.byteLength,
        }).returning({ id: photos.id });

        photoId = photoResult[0].id;
        photoUri = `/api/photos/${photoId}`;
      }

      const result = await db.insert(entries).values({
        userId: user.id,
        photoId,
        photoUri,
        amount: parseFloat(amount),
        currency,
        category: categoryVal,
        note,
        createdAt,
      }).returning({ id: entries.id });

      return NextResponse.json({ id: result[0].id, photoId, photoUri }, { status: 201 });
    } catch (err) {
      console.error("[entries POST multipart] Error:", err);
      return NextResponse.json({ error: "Failed to save entry" }, { status: 500 });
    }
  }

  // ── JSON: quick-add (no photo) or legacy with pre-uploaded photoId ──
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
