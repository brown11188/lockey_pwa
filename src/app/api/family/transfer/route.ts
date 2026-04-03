import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { families, familyMembers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";
import { getUserFamily, getFamilyMember } from "@/lib/family-utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const row = await getUserFamily(user.id);
  if (!row) return NextResponse.json({ error: "Not in a family" }, { status: 404 });
  if (row.member.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });

  const { toUserId } = await req.json();
  if (!toUserId || toUserId === user.id) {
    return NextResponse.json({ error: "Invalid target user" }, { status: 400 });
  }

  const targetMember = await getFamilyMember(row.family.id, toUserId);
  if (!targetMember) {
    return NextResponse.json({ error: "User is not a family member" }, { status: 404 });
  }

  // Transfer: new owner becomes owner, old owner becomes member
  await db
    .update(familyMembers)
    .set({ role: "owner" })
    .where(and(eq(familyMembers.familyId, row.family.id), eq(familyMembers.userId, toUserId)));

  await db
    .update(familyMembers)
    .set({ role: "member" })
    .where(and(eq(familyMembers.familyId, row.family.id), eq(familyMembers.userId, user.id)));

  await db
    .update(families)
    .set({ ownerId: toUserId, updatedAt: new Date() })
    .where(eq(families.id, row.family.id));

  return NextResponse.json({ success: true });
}
