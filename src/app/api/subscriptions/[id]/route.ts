import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const body = await req.json();

  const existing = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, user.id)))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .update(subscriptions)
    .set({
      name: body.name ?? existing.name,
      logoUrl: body.logoUrl !== undefined ? body.logoUrl : existing.logoUrl,
      amount: body.amount != null ? parseFloat(body.amount) : existing.amount,
      currency: body.currency ?? existing.currency,
      cycle: body.cycle ?? existing.cycle,
      nextRenewalDate: body.nextRenewalDate ?? existing.nextRenewalDate,
      categoryId: body.categoryId !== undefined ? body.categoryId : existing.categoryId,
      note: body.note !== undefined ? body.note : existing.note,
      reminderDaysBefore: body.reminderDaysBefore ?? existing.reminderDaysBefore,
      isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
    })
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, user.id)));

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;

  await db
    .delete(subscriptions)
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, user.id)));

  return NextResponse.json({ success: true });
}