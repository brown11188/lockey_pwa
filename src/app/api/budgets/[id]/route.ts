import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { budgets } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;

  await db
    .delete(budgets)
    .where(and(eq(budgets.id, id), eq(budgets.userId, user.id)));

  return NextResponse.json({ success: true });
}