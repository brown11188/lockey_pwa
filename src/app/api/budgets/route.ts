import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { budgets, entries } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const now = new Date();
  const monthKey = format(now, "yyyy-MM-01");
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  // Get all budgets applicable this month (recurring or specific to this month)
  const allBudgets = await db
    .select()
    .from(budgets)
    .where(
      and(
        eq(budgets.userId, user.id),
        sql`(${budgets.isRecurring} = 1 OR ${budgets.appliedFrom} = ${monthKey})`
      )
    );

  // Get spending per category this month
  const spending = await db
    .select({
      category: entries.category,
      total: sql<number>`COALESCE(SUM(${entries.amount}), 0)`.as("total"),
    })
    .from(entries)
    .where(
      and(
        eq(entries.userId, user.id),
        sql`date(${entries.createdAt}) >= ${monthStart} AND date(${entries.createdAt}) <= ${monthEnd}`
      )
    )
    .groupBy(entries.category);

  const spendingMap = new Map(spending.map((s) => [s.category, s.total]));

  const result = allBudgets.map((b) => ({
    ...b,
    spent: spendingMap.get(b.categoryId) ?? 0,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json();
  const { categoryId, monthlyBudget, currency, isRecurring, appliedFrom } = body;

  if (!categoryId || monthlyBudget == null) {
    return NextResponse.json(
      { error: "Missing required fields (categoryId, monthlyBudget)" },
      { status: 400 }
    );
  }

  const monthKey = appliedFrom || format(new Date(), "yyyy-MM-01");

  // Check if budget already exists for this category/month
  const existing = await db
    .select()
    .from(budgets)
    .where(
      and(
        eq(budgets.userId, user.id),
        eq(budgets.categoryId, categoryId)
      )
    )
    .get();

  if (existing) {
    await db
      .update(budgets)
      .set({
        monthlyBudget: parseFloat(monthlyBudget),
        currency: currency || "VND",
        isRecurring: isRecurring ?? true,
        appliedFrom: monthKey,
      })
      .where(eq(budgets.id, existing.id));
  } else {
    await db.insert(budgets).values({
      userId: user.id,
      categoryId,
      monthlyBudget: parseFloat(monthlyBudget),
      currency: currency || "VND",
      isRecurring: isRecurring ?? true,
      appliedFrom: monthKey,
    });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}