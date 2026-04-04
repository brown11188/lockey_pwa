import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { budgets, entries } from "@/db/schema";
import { eq, and, sql, or } from "drizzle-orm";
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

  // Parallelize both DB queries (Fix #6)
  const [allBudgets, spending] = await Promise.all([
    db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, user.id),
          or(eq(budgets.isRecurring, true), eq(budgets.appliedFrom, monthKey))
        )
      ),
    db
      .select({
        category: entries.category,
        total: sql<number>`COALESCE(SUM(${entries.amount}), 0)`.as("total"),
      })
      .from(entries)
      .where(
        and(
          eq(entries.userId, user.id),
          sql`(${entries.createdAt})::date >= ${monthStart}::date AND (${entries.createdAt})::date <= ${monthEnd}::date`
        )
      )
      .groupBy(entries.category),
  ]);

  const spendingMap = new Map(spending.map((s) => [s.category, s.total]));
  const totalSpent = spending.reduce((sum, s) => sum + s.total, 0);

  const result = allBudgets.map((b) => ({
    ...b,
    spent: b.categoryId === "__all__" ? totalSpent : (spendingMap.get(b.categoryId) ?? 0),
  }));

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=120' },
  });
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

  const [existing] = await db
    .select()
    .from(budgets)
    .where(and(eq(budgets.userId, user.id), eq(budgets.categoryId, categoryId)))
    .limit(1);

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
