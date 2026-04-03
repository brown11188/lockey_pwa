import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { familyMembers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";
import { getUserFamily, getFamilyMember } from "@/lib/family-utils";

export const dynamic = "force-dynamic";

// DELETE /api/family/members/[userId] — owner removes a member
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { userId } = await params;

  const row = await getUserFamily(user.id);
  if (!row) return NextResponse.json({ error: "Not in a family" }, { status: 404 });
  if (row.member.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });
  if (userId === user.id) return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });

  const target = await getFamilyMember(row.family.id, userId);
  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  await db
    .delete(familyMembers)
    .where(and(eq(familyMembers.familyId, row.family.id), eq(familyMembers.userId, userId)));

  return NextResponse.json({ success: true });
}

// PATCH /api/family/members/[userId] — member toggles own privacy (userId must be "me" or own id)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { userId } = await params;
  const targetId = userId === "me" ? user.id : userId;
  if (targetId !== user.id) return NextResponse.json({ error: "Can only update your own privacy" }, { status: 403 });

  const row = await getUserFamily(user.id);
  if (!row) return NextResponse.json({ error: "Not in a family" }, { status: 404 });

  const { isPrivate } = await req.json();
  await db
    .update(familyMembers)
    .set({ isPrivate: Boolean(isPrivate) })
    .where(and(eq(familyMembers.familyId, row.family.id), eq(familyMembers.userId, user.id)));

  return NextResponse.json({ success: true });
}
