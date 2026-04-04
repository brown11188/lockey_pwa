import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { entries } from "@/db/schema";
import { desc, and, eq, sql, gte, lte } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";

export const dynamic = "force-dynamic";

function escapeCsv(val: string): string {
  if (val.includes('"') || val.includes(",") || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const sp = req.nextUrl.searchParams;
  const conditions = [eq(entries.userId, user.id)];

  const dateFrom = sp.get("dateFrom");
  const dateTo = sp.get("dateTo");
  if (dateFrom) conditions.push(sql`(${entries.createdAt})::date >= ${dateFrom}::date`);
  if (dateTo) conditions.push(sql`(${entries.createdAt})::date <= ${dateTo}::date`);

  const category = sp.get("category");
  if (category) conditions.push(eq(entries.category, category));

  const results = await db
    .select()
    .from(entries)
    .where(and(...conditions))
    .orderBy(desc(entries.createdAt));

  // Build CSV
  const header = "Date,Category,Amount,Currency,Note";
  const rows = results.map((e) =>
    [
      escapeCsv(e.createdAt),
      escapeCsv(e.category),
      String(e.amount),
      escapeCsv(e.currency),
      escapeCsv(e.note ?? ""),
    ].join(",")
  );
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lockey-expenses-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
