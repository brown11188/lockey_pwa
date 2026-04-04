import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savingGoals } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const body = await req.json();
  const { name, emoji, targetAmount, currentAmount, currency, deadline, isCompleted } = body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (emoji !== undefined) updateData.emoji = emoji;
  if (targetAmount !== undefined) updateData.targetAmount = parseFloat(targetAmount);
  if (currentAmount !== undefined) updateData.currentAmount = parseFloat(currentAmount);
  if (currency !== undefined) updateData.currency = currency;
  if (deadline !== undefined) updateData.deadline = deadline;
  if (isCompleted !== undefined) updateData.isCompleted = isCompleted;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await db
    .update(savingGoals)
    .set(updateData)
    .where(and(eq(savingGoals.id, id), eq(savingGoals.userId, user.id)));

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  await db
    .delete(savingGoals)
    .where(and(eq(savingGoals.id, id), eq(savingGoals.userId, user.id)));

  return NextResponse.json({ success: true });
}
