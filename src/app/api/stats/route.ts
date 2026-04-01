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

  const dateRange = (start: Date, end: Date) =>
    sql`(${entries.createdAt})::date >= ${format(start, "yyyy-MM-dd")}::date AND (${entries.createdAt})::date <= ${format(end, "yyyy-MM-dd")}::date`;

  // Total spent this week
  const [weekTotalRow] = await db
    .select({ total: sql<number>`COALESCE(SUM(${entries.amount}), 0)` })
    .from(entries)
    .where(and(userFilter, dateRange(weekStart, weekEnd)));

  // Total spent this month
  const [monthTotalRow] = await db
    .select({ total: sql<number>`COALESCE(SUM(${entries.amount}), 0)` })
    .from(entries)
    .where(and(userFilter, dateRange(monthStart, monthEnd)));

  // Most expensive category this month
  const [topCategory] = await db
    .select({
      category: entries.category,
      total: sql<number>`SUM(${entries.amount})`,
    })
    .from(entries)
    .where(and(userFilter, dateRange(monthStart, monthEnd)))
    .groupBy(entries.category)
    .orderBy(sql`SUM(${entries.amount}) DESC`)
    .limit(1);

  // Daily spending for the selected period
  const isWeekView = view === "week";
  const periodStart = isWeekView ? weekStart : monthStart;
  const periodEnd = isWeekView ? weekEnd : monthEnd;

  const dailySpendingRows = await db
    .select({
      date: sql<string>`((${entries.createdAt})::date)::text`.as("date"),
      total: sql<number>`SUM(${entries.amount})`.as("total"),
    })
    .from(entries)
    .where(and(userFilter, dateRange(periodStart, periodEnd)))
    .groupBy(sql`(${entries.createdAt})::date`)
    .orderBy(sql`(${entries.createdAt})::date`);

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

  // Category breakdown for the selected period
  const categoryBreakdown = await db
    .select({
      category: entries.category,
      total: sql<number>`SUM(${entries.amount})`.as("total"),
      count: sql<number>`COUNT(*)`.as("count"),
    })
    .from(entries)
    .where(and(userFilter, dateRange(periodStart, periodEnd)))
    .groupBy(entries.category)
    .orderBy(sql`SUM(${entries.amount}) DESC`);

  // Recent transactions (last 10)
  const recentTransactions = await db
    .select()
    .from(entries)
    .where(userFilter)
    .orderBy(desc(entries.createdAt))
    .limit(10);

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
