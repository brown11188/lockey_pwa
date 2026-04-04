import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savingGoals } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const results = await db
    .select()
    .from(savingGoals)
    .where(eq(savingGoals.userId, user.id))
    .orderBy(desc(savingGoals.createdAt));

  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json();
  const { name, emoji, targetAmount, currency, deadline } = body;

  if (!name || !targetAmount || targetAmount <= 0) {
    return NextResponse.json(
      { error: "Name and positive target amount are required" },
      { status: 400 }
    );
  }

  const result = await db
    .insert(savingGoals)
    .values({
      userId: user.id,
      name,
      emoji: emoji || "🎯",
      targetAmount: parseFloat(targetAmount),
      currency: currency || "VND",
      deadline: deadline || null,
    })
    .returning({ id: savingGoals.id });

  return NextResponse.json({ id: result[0].id }, { status: 201 });
}
