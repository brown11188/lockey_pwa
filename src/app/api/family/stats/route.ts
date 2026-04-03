import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { entries, familyMembers, subscriptions } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";
import { getUserFamily } from "@/lib/family-utils";
import { convertAmount, FALLBACK_RATES } from "@/lib/currency-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const row = await getUserFamily(user.id);
  if (!row) return NextResponse.json({ error: "Not in a family" }, { status: 403 });

  // Get all non-private members
  const members = await db
    .select()
    .from(familyMembers)
    .where(and(eq(familyMembers.familyId, row.family.id), eq(familyMembers.isPrivate, false)));

  const memberIds = members.map((m) => m.userId);
  if (!memberIds.length) return NextResponse.json({ thisMonth: 0, currency: row.family.budgetCurrency });

  // Start of current month
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  // Fetch exchange rates for conversion (best-effort; fallback to hardcoded)
  let rates = FALLBACK_RATES;
  try {
    const rateRes = await fetch(`${process.env.AUTH_URL ?? "http://localhost:3000"}/api/exchange-rates`);
    if (rateRes.ok) rates = (await rateRes.json()).rates ?? FALLBACK_RATES;
  } catch { /* use fallback */ }

  const targetCurrency = row.family.budgetCurrency ?? "VND";

  // Sum this-month entries for all non-private members
  let thisMonth = 0;
  for (const memberId of memberIds) {
    const rows = await db
      .select()
      .from(entries)
      .where(and(eq(entries.userId, memberId), gte(entries.createdAt, monthStart)));

    for (const e of rows) {
      thisMonth += convertAmount(e.amount, e.currency, targetCurrency, rates);
    }
  }

  // Shared subscriptions monthly total
  let sharedSubsTotal = 0;
  for (const memberId of memberIds) {
    const subs = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, memberId), eq(subscriptions.isShared, true), eq(subscriptions.isActive, true)));

    for (const s of subs) {
      let monthly = s.amount;
      if (s.cycle === "yearly") monthly = s.amount / 12;
      if (s.cycle === "weekly") monthly = s.amount * (52 / 12);
      sharedSubsTotal += convertAmount(monthly, s.currency, targetCurrency, rates);
    }
  }

  return NextResponse.json({
    thisMonth: Math.round(thisMonth),
    sharedSubsMonthly: Math.round(sharedSubsTotal),
    currency: targetCurrency,
    budget: row.family.monthlyBudget,
    participatingMembers: memberIds.length,
  });
}
