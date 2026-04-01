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

  // Total spent this week
  const weekTotal = db
    .select({ total: sql<number>`COALESCE(SUM(${entries.amount}), 0)` })
    .from(entries)
    .where(
      and(
        userFilter,
        sql`date(${entries.createdAt}) >= ${format(weekStart, "yyyy-MM-dd")} AND date(${entries.createdAt}) <= ${format(weekEnd, "yyyy-MM-dd")}`
      )
    )
    .get();

  // Total spent this month
  const monthTotal = db
    .select({ total: sql<number>`COALESCE(SUM(${entries.amount}), 0)` })
    .from(entries)
    .where(
      and(
        userFilter,
        sql`date(${entries.createdAt}) >= ${format(monthStart, "yyyy-MM-dd")} AND date(${entries.createdAt}) <= ${format(monthEnd, "yyyy-MM-dd")}`
      )
    )
    .get();

  // Most expensive category this month
  const topCategory = db
    .select({
      category: entries.category,
      total: sql<number>`SUM(${entries.amount})`,
    })
    .from(entries)
    .where(
      and(
        userFilter,
        sql`date(${entries.createdAt}) >= ${format(monthStart, "yyyy-MM-dd")} AND date(${entries.createdAt}) <= ${format(monthEnd, "yyyy-MM-dd")}`
      )
    )
    .groupBy(entries.category)
    .orderBy(sql`SUM(${entries.amount}) DESC`)
    .limit(1)
    .get();

  // Daily spending for the selected period
  const isWeekView = view === "week";
  const periodStart = isWeekView ? weekStart : monthStart;
  const periodEnd = isWeekView ? weekEnd : monthEnd;

  const dailySpending = db
    .select({
      date: sql<string>`date(${entries.createdAt})`.as("date"),
      total: sql<number>`SUM(${entries.amount})`.as("total"),
    })
    .from(entries)
    .where(
      and(
        userFilter,
        sql`date(${entries.createdAt}) >= ${format(periodStart, "yyyy-MM-dd")} AND date(${entries.createdAt}) <= ${format(periodEnd, "yyyy-MM-dd")}`
      )
    )
    .groupBy(sql`date(${entries.createdAt})`)
    .orderBy(sql`date(${entries.createdAt})`);

  const dailyMap = new Map(
    (await dailySpending).map((d) => [d.date, d.total])
  );

  const allDays = eachDayOfInterval({
    start: periodStart,
    end: periodEnd,
  }).map((day) => {
    const key = format(day, "yyyy-MM-dd");
    return {
      date: key,
      label: format(day, isWeekView ? "EEE" : "d"),
      total: dailyMap.get(key) ?? 0,
    };
  });

  // Category breakdown for the selected period
  const categoryBreakdown = db
    .select({
      category: entries.category,
      total: sql<number>`SUM(${entries.amount})`.as("total"),
      count: sql<number>`COUNT(*)`.as("count"),
    })
    .from(entries)
    .where(
      and(
        userFilter,
        sql`date(${entries.createdAt}) >= ${format(periodStart, "yyyy-MM-dd")} AND date(${entries.createdAt}) <= ${format(periodEnd, "yyyy-MM-dd")}`
      )
    )
    .groupBy(entries.category)
    .orderBy(sql`SUM(${entries.amount}) DESC`);

  // Recent transactions (last 10)
  const recent = db
    .select()
    .from(entries)
    .where(userFilter)
    .orderBy(desc(entries.createdAt))
    .limit(10);

  const [dailyResult, categoryResult, recentResult] = await Promise.all([
    allDays,
    categoryBreakdown,
    recent,
  ]);

  return NextResponse.json({
    weekTotal: weekTotal?.total ?? 0,
    monthTotal: monthTotal?.total ?? 0,
    topCategory: topCategory?.category ?? null,
    topCategoryTotal: topCategory?.total ?? 0,
    dailySpending: dailyResult,
    categoryBreakdown: categoryResult,
    recentTransactions: recentResult,
  });
}
