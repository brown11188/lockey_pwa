import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { entries } from "@/db/schema";
import { sql, desc, and, eq } from "drizzle-orm";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  eachDayOfInterval,
} from "date-fns";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const sp = req.nextUrl.searchParams;
  const view = sp.get("view") ?? "week";
  const now = new Date();
  const userFilter = eq(entries.userId, user.id);

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const isWeekView = view === "week";
  const periodStart = isWeekView ? weekStart : monthStart;
  const periodEnd = isWeekView ? weekEnd : monthEnd;

  const dateRange = (start: Date, end: Date) =>
    sql`(${entries.createdAt})::date >= ${format(start, "yyyy-MM-dd")}::date AND (${entries.createdAt})::date <= ${format(end, "yyyy-MM-dd")}::date`;

  // ── Run all 6 queries in parallel instead of sequentially ──────────────────
  const [
    [weekTotalRow],
    [monthTotalRow],
    [topCategory],
    dailySpendingRows,
    categoryBreakdown,
    recentTransactions,
  ] = await Promise.all([
    // 1. Total this week
    db
      .select({ total: sql<number>`COALESCE(SUM(${entries.amount}), 0)` })
      .from(entries)
      .where(and(userFilter, dateRange(weekStart, weekEnd))),

    // 2. Total this month
    db
      .select({ total: sql<number>`COALESCE(SUM(${entries.amount}), 0)` })
      .from(entries)
      .where(and(userFilter, dateRange(monthStart, monthEnd))),

    // 3. Top category this month
    db
      .select({
        category: entries.category,
        total: sql<number>`SUM(${entries.amount})`,
      })
      .from(entries)
      .where(and(userFilter, dateRange(monthStart, monthEnd)))
      .groupBy(entries.category)
      .orderBy(sql`SUM(${entries.amount}) DESC`)
      .limit(1),

    // 4. Daily spending for selected period
    db
      .select({
        date: sql<string>`((${entries.createdAt})::date)::text`.as("date"),
        total: sql<number>`SUM(${entries.amount})`.as("total"),
      })
      .from(entries)
      .where(and(userFilter, dateRange(periodStart, periodEnd)))
      .groupBy(sql`(${entries.createdAt})::date`)
      .orderBy(sql`(${entries.createdAt})::date`),

    // 5. Category breakdown for selected period
    db
      .select({
        category: entries.category,
        total: sql<number>`SUM(${entries.amount})`.as("total"),
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(entries)
      .where(and(userFilter, dateRange(periodStart, periodEnd)))
      .groupBy(entries.category)
      .orderBy(sql`SUM(${entries.amount}) DESC`),

    // 6. Recent transactions (last 10)
    db
      .select()
      .from(entries)
      .where(userFilter)
      .orderBy(desc(entries.createdAt))
      .limit(10),
  ]);

  const dailyMap = new Map(dailySpendingRows.map((d) => [d.date, d.total]));

  const allDays = eachDayOfInterval({ start: periodStart, end: periodEnd }).map(
    (day) => {
      const key = format(day, "yyyy-MM-dd");
      return {
        date: key,
        label: format(day, isWeekView ? "EEE" : "d"),
        total: dailyMap.get(key) ?? 0,
      };
    }
  );

  return NextResponse.json({
    weekTotal: weekTotalRow?.total ?? 0,
    monthTotal: monthTotalRow?.total ?? 0,
    topCategory: topCategory?.category ?? null,
    topCategoryTotal: topCategory?.total ?? 0,
    dailySpending: allDays,
    categoryBreakdown,
    recentTransactions,
  });
}
