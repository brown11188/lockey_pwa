import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { entries, wrappedDismissals } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";

export const dynamic = "force-dynamic";

function getMonthRange(year: number, month: number) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const start = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${pad(month)}-${pad(lastDay)}`;
  return { start, end };
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const sp = req.nextUrl.searchParams;
  const monthParam = sp.get("month"); // YYYY-MM

  let year: number;
  let month: number;

  if (monthParam) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m;
  } else {
    const now = new Date();
    year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    month = now.getMonth() === 0 ? 12 : now.getMonth();
  }

  const { start, end } = getMonthRange(year, month);
  const monthKey = `${year}-${month.toString().padStart(2, "0")}`;

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevRange = getMonthRange(prevYear, prevMonth);

  const userFilter = eq(entries.userId, user.id);
  const dateFilter = sql`(${entries.createdAt})::date >= ${start}::date AND (${entries.createdAt})::date <= ${end}::date`;
  const prevDateFilter = sql`(${entries.createdAt})::date >= ${prevRange.start}::date AND (${entries.createdAt})::date <= ${prevRange.end}::date`;

  // ── Batch 1: dismissed check + total spending (always needed) ──────────────
  const [[dismissed], [totalResult]] = await Promise.all([
    db
      .select()
      .from(wrappedDismissals)
      .where(and(eq(wrappedDismissals.userId, user.id), eq(wrappedDismissals.monthKey, monthKey)))
      .limit(1),

    db
      .select({
        total: sql<number>`COALESCE(SUM(${entries.amount}), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(entries)
      .where(and(userFilter, dateFilter)),
  ]);

  const totalSpending = totalResult?.total ?? 0;
  const entryCount = totalResult?.count ?? 0;

  if (entryCount === 0) {
    return NextResponse.json({ hasData: false, dismissed: !!dismissed, monthKey });
  }

  // ── Batch 2: all remaining queries in parallel ─────────────────────────────
  const [
    [activeDays],
    [topCategory],
    [biggestDay],
    [prevTotal],
    [foodSpending],
    prevCategories,
    currentCategories,
  ] = await Promise.all([
    // Active days
    db
      .select({ count: sql<number>`COUNT(DISTINCT (${entries.createdAt})::date)` })
      .from(entries)
      .where(and(userFilter, dateFilter)),

    // Top category this month
    db
      .select({
        category: entries.category,
        total: sql<number>`SUM(${entries.amount})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(entries)
      .where(and(userFilter, dateFilter))
      .groupBy(entries.category)
      .orderBy(sql`SUM(${entries.amount}) DESC`)
      .limit(1),

    // Biggest spending day
    db
      .select({
        date: sql<string>`((${entries.createdAt})::date)::text`.as("day"),
        total: sql<number>`SUM(${entries.amount})`.as("total"),
      })
      .from(entries)
      .where(and(userFilter, dateFilter))
      .groupBy(sql`(${entries.createdAt})::date`)
      .orderBy(sql`SUM(${entries.amount}) DESC`)
      .limit(1),

    // Previous month total
    db
      .select({ total: sql<number>`COALESCE(SUM(${entries.amount}), 0)` })
      .from(entries)
      .where(and(userFilter, prevDateFilter)),

    // Food spending
    db
      .select({ total: sql<number>`COALESCE(SUM(${entries.amount}), 0)` })
      .from(entries)
      .where(and(userFilter, dateFilter, eq(entries.category, "food"))),

    // Previous month category breakdown
    db
      .select({
        category: entries.category,
        total: sql<number>`SUM(${entries.amount})`,
      })
      .from(entries)
      .where(and(userFilter, prevDateFilter))
      .groupBy(entries.category),

    // Current month category breakdown (for diff)
    db
      .select({
        category: entries.category,
        total: sql<number>`SUM(${entries.amount})`,
      })
      .from(entries)
      .where(and(userFilter, dateFilter))
      .groupBy(entries.category),
  ]);

  // Compute top-change category
  let prevTopChangeCategory: string | null = null;
  if (prevTotal && prevTotal.total > 0) {
    const prevMap = new Map(prevCategories.map((c) => [c.category, c.total]));
    let maxDiff = 0;
    for (const cat of currentCategories) {
      const diff = cat.total - (prevMap.get(cat.category) ?? 0);
      if (Math.abs(diff) > Math.abs(maxDiff)) {
        maxDiff = diff;
        prevTopChangeCategory = cat.category;
      }
    }
  }

  return NextResponse.json({
    hasData: true,
    dismissed: !!dismissed,
    monthKey,
    year,
    month,
    totalSpending,
    entryCount,
    activeDays: activeDays?.count ?? 0,
    topCategory: topCategory
      ? {
          category: topCategory.category,
          total: topCategory.total,
          count: topCategory.count,
          pct: totalSpending > 0 ? Math.round((topCategory.total / totalSpending) * 100) : 0,
        }
      : null,
    biggestDay: biggestDay ? { date: biggestDay.date, total: biggestDay.total } : null,
    comparison: {
      prevTotal: prevTotal?.total ?? 0,
      diff: totalSpending - (prevTotal?.total ?? 0),
      pct:
        prevTotal && prevTotal.total > 0
          ? Math.round(
              (Math.abs(totalSpending - prevTotal.total) / prevTotal.total) * 100
            )
          : 0,
      increased: totalSpending > (prevTotal?.total ?? 0),
      topChangeCategory: prevTopChangeCategory,
    },
    foodSpending: foodSpending?.total ?? 0,
  });
}

// POST - dismiss wrapped for a month
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json();
  const { monthKey } = body as { monthKey: string };

  if (!monthKey) {
    return NextResponse.json({ error: "monthKey required" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(wrappedDismissals)
    .where(and(eq(wrappedDismissals.userId, user.id), eq(wrappedDismissals.monthKey, monthKey)))
    .limit(1);

  if (!existing) {
    await db.insert(wrappedDismissals).values({ userId: user.id, monthKey });
  }

  return NextResponse.json({ ok: true });
}
