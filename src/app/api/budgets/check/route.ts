import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { budgets, entries } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";

export const dynamic = "force-dynamic";

/**
 * POST /api/budgets/check
 * Body: { categoryId: string }
 * Returns the budget status for the given category this month.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { categoryId } = await req.json();
  if (!categoryId) {
    return NextResponse.json({ hasBudget: false });
  }

  const now = new Date();
  const monthKey = format(now, "yyyy-MM-01");
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const budget = await db
    .select()
    .from(budgets)
    .where(
      and(
        eq(budgets.userId, user.id),
        eq(budgets.categoryId, categoryId),
        sql`(${budgets.isRecurring} = 1 OR ${budgets.appliedFrom} = ${monthKey})`
      )
    )
    .get();

  if (!budget) {
    return NextResponse.json({ hasBudget: false });
  }

  const spending = await db
    .select({
      total: sql<number>`COALESCE(SUM(${entries.amount}), 0)`.as("total"),
    })
    .from(entries)
    .where(
      and(
        eq(entries.userId, user.id),
        eq(entries.category, categoryId),
        sql`date(${entries.createdAt}) >= ${monthStart} AND date(${entries.createdAt}) <= ${monthEnd}`
      )
    )
    .get();

  const spent = spending?.total ?? 0;
  const pct = budget.monthlyBudget > 0 ? Math.round((spent / budget.monthlyBudget) * 100) : 0;

  return NextResponse.json({
    hasBudget: true,
    categoryId,
    monthlyBudget: budget.monthlyBudget,
    spent,
    pct,
    exceeded: pct >= 100,
    warning: pct >= 80 && pct < 100,
  });
}