import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, entries } from "@/db/schema";
import { and, eq, lte, sql } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";
import { addDays, addWeeks, addMonths, addYears, format } from "date-fns";

export const dynamic = "force-dynamic";

function getNextRenewal(currentDate: string, cycle: string): string {
  const date = new Date(currentDate);
  switch (cycle) {
    case "weekly":  return format(addWeeks(date, 1), "yyyy-MM-dd");
    case "monthly": return format(addMonths(date, 1), "yyyy-MM-dd");
    case "yearly":  return format(addYears(date, 1), "yyyy-MM-dd");
    default:        return format(addMonths(date, 1), "yyyy-MM-dd");
  }
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const today = format(new Date(), "yyyy-MM-dd");

  // Find active subscriptions due for renewal (nextRenewalDate <= today)
  const dueSubs = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.isActive, true),
        lte(subscriptions.nextRenewalDate, today)
      )
    );

  const created: string[] = [];

  for (const sub of dueSubs) {
    // Create expense entry for this subscription
    await db.insert(entries).values({
      userId: user.id,
      amount: sub.amount,
      currency: sub.currency,
      category: sub.categoryId ?? "bills",
      note: `🔄 ${sub.name} (auto)`,
      createdAt: new Date(sub.nextRenewalDate + "T12:00:00Z").toISOString(),
    });

    // Advance the renewal date
    const nextDate = getNextRenewal(sub.nextRenewalDate, sub.cycle);
    await db
      .update(subscriptions)
      .set({ nextRenewalDate: nextDate })
      .where(eq(subscriptions.id, sub.id));

    created.push(sub.name);
  }

  return NextResponse.json({
    processed: created.length,
    subscriptions: created,
  });
}
