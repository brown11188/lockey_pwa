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
    // Default: last month (auto-trigger on 1st of month)
    const now = new Date();
    year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    month = now.getMonth() === 0 ? 12 : now.getMonth();
  }

  const { start, end } = getMonthRange(year, month);
  const monthKey = `${year}-${month.toString().padStart(2, "0")}`;

  // Check if already dismissed
  const dismissed = await db
    .select()
    .from(wrappedDismissals)
    .where(
      and(
        eq(wrappedDismissals.userId, user.id),
        eq(wrappedDismissals.monthKey, monthKey)
      )
    )
    .get();

  const userFilter = eq(entries.userId, user.id);
  const dateFilter = sql`date(${entries.createdAt}) >= ${start} AND date(${entries.createdAt}) <= ${end}`;

  // Total spending this month
  const totalResult = await db
    .select({
      total: sql<number>`COALESCE(SUM(${entries.amount}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(entries)
    .where(and(userFilter, dateFilter))
    .get();

  const totalSpending = totalResult?.total ?? 0;
  const entryCount = totalResult?.count ?? 0;

  if (entryCount === 0) {
    return NextResponse.json({ hasData: false, dismissed: !!dismissed, monthKey });
  }

  // Days with entries
  const activeDays = await db
    .select({ count: sql<number>`COUNT(DISTINCT date(${entries.createdAt}))` })
    .from(entries)
    .where(and(userFilter, dateFilter))
    .get();

  // Top category
  const topCategory = await db
    .select({
      category: entries.category,
      total: sql<number>`SUM(${entries.amount})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(entries)
    .where(and(userFilter, dateFilter))
    .groupBy(entries.category)
    .orderBy(sql`SUM(${entries.amount}) DESC`)
    .limit(1)
    .get();

  // Biggest day
  const biggestDay = await db
    .select({
      date: sql<string>`date(${entries.createdAt})`.as("day"),
      total: sql<number>`SUM(${entries.amount})`.as("total"),
    })
    .from(entries)
    .where(and(userFilter, dateFilter))
    .groupBy(sql`date(${entries.createdAt})`)
    .orderBy(sql`SUM(${entries.amount}) DESC`)
    .limit(1)
    .get();

  // Previous month comparison
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevRange = getMonthRange(prevYear, prevMonth);
  const prevTotal = await db
    .select({ total: sql<number>`COALESCE(SUM(${entries.amount}), 0)` })
    .from(entries)
    .where(
      and(
        userFilter,
        sql`date(${entries.createdAt}) >= ${prevRange.start} AND date(${entries.createdAt}) <= ${prevRange.end}`
      )
    )
    .get();

  // Previous month top change category
  let prevTopChangeCategory: string | null = null;
  if (prevTotal && prevTotal.total > 0) {
    const prevCategories = await db
      .select({
        category: entries.category,
        total: sql<number>`SUM(${entries.amount})`,
      })
      .from(entries)
      .where(
        and(
          userFilter,
          sql`date(${entries.createdAt}) >= ${prevRange.start} AND date(${entries.createdAt}) <= ${prevRange.end}`
        )
      )
      .groupBy(entries.category);

    const currentCategories = await db
      .select({
        category: entries.category,
        total: sql<number>`SUM(${entries.amount})`,
      })
      .from(entries)
      .where(and(userFilter, dateFilter))
      .groupBy(entries.category);

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

  // Food spending (for fun fact)
  const foodSpending = await db
    .select({ total: sql<number>`COALESCE(SUM(${entries.amount}), 0)` })
    .from(entries)
    .where(
      and(userFilter, dateFilter, eq(entries.category, "food"))
    )
    .get();

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
    biggestDay: biggestDay
      ? {
          date: biggestDay.date,
          total: biggestDay.total,
        }
      : null,
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

  // Check if already dismissed
  const existing = await db
    .select()
    .from(wrappedDismissals)
    .where(
      and(
        eq(wrappedDismissals.userId, user.id),
        eq(wrappedDismissals.monthKey, monthKey)
      )
    )
    .get();

  if (!existing) {
    await db.insert(wrappedDismissals).values({
      userId: user.id,
      monthKey,
    });
  }

  return NextResponse.json({ ok: true });
}
