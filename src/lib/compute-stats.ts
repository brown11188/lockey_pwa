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
import type { Entry } from "@/db/schema";

export interface StatsData {
  weekTotal: number;
  monthTotal: number;
  topCategory: string | null;
  topCategoryTotal: number;
  dailySpending: { date: string; label: string; total: number }[];
  categoryBreakdown: { category: string; total: number; count: number }[];
  recentTransactions: Entry[];
}

export async function computeStats(
  userId: string,
  view: "week" | "month" = "week"
): Promise<StatsData> {
  const now = new Date();
  const userFilter = eq(entries.userId, userId);

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const isWeekView = view === "week";
  const periodStart = isWeekView ? weekStart : monthStart;
  const periodEnd = isWeekView ? weekEnd : monthEnd;

  const dateRange = (start: Date, end: Date) =>
    sql`(${entries.createdAt})::date >= ${format(start, "yyyy-MM-dd")}::date AND (${entries.createdAt})::date <= ${format(end, "yyyy-MM-dd")}::date`;

  const [
    [weekTotalRow],
    [monthTotalRow],
    [topCategory],
    dailySpendingRows,
    categoryBreakdown,
    recentTransactions,
  ] = await Promise.all([
    db
      .select({ total: sql<number>`COALESCE(SUM(${entries.amount}), 0)` })
      .from(entries)
      .where(and(userFilter, dateRange(weekStart, weekEnd))),

    db
      .select({ total: sql<number>`COALESCE(SUM(${entries.amount}), 0)` })
      .from(entries)
      .where(and(userFilter, dateRange(monthStart, monthEnd))),

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

    db
      .select({
        date: sql<string>`((${entries.createdAt})::date)::text`.as("date"),
        total: sql<number>`SUM(${entries.amount})`.as("total"),
      })
      .from(entries)
      .where(and(userFilter, dateRange(periodStart, periodEnd)))
      .groupBy(sql`(${entries.createdAt})::date`)
      .orderBy(sql`(${entries.createdAt})::date`),

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

  return {
    weekTotal: weekTotalRow?.total ?? 0,
    monthTotal: monthTotalRow?.total ?? 0,
    topCategory: topCategory?.category ?? null,
    topCategoryTotal: topCategory?.total ?? 0,
    dailySpending: allDays,
    categoryBreakdown,
    recentTransactions: recentTransactions as Entry[],
  };
}
