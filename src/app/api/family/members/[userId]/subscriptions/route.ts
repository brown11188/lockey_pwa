import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/db/schema";
import { eq, desc, or } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";
import { getUserFamily, getFamilyMember } from "@/lib/family-utils";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { userId } = await params;

  const row = await getUserFamily(user.id);
  if (!row) return NextResponse.json({ error: "Not in a family" }, { status: 403 });

  const targetMember = await getFamilyMember(row.family.id, userId);
  if (!targetMember) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  if (targetMember.isPrivate && userId !== user.id) {
    return NextResponse.json({ error: "Member data is private" }, { status: 403 });
  }

  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt));

  return NextResponse.json(rows);
}
