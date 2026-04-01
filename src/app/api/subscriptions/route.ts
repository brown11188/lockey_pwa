import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .orderBy(desc(subscriptions.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json();
  const {
    name,
    logoUrl,
    amount,
    currency,
    cycle,
    nextRenewalDate,
    categoryId,
    note,
    reminderDaysBefore,
    isActive,
  } = body;

  if (!name || amount == null || !nextRenewalDate) {
    return NextResponse.json(
      { error: "Missing required fields (name, amount, nextRenewalDate)" },
      { status: 400 }
    );
  }

  const result = await db.insert(subscriptions).values({
    userId: user.id,
    name,
    logoUrl: logoUrl || null,
    amount: parseFloat(amount),
    currency: currency || "VND",
    cycle: cycle || "monthly",
    nextRenewalDate,
    categoryId: categoryId || null,
    note: note || "",
    reminderDaysBefore: reminderDaysBefore ?? 3,
    isActive: isActive ?? true,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}