import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { families, familyMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";
import { getUserFamily } from "@/lib/family-utils";

export const dynamic = "force-dynamic";

const MAX_MEMBERS = 6;

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const existing = await getUserFamily(user.id);
  if (existing) {
    return NextResponse.json({ error: "Already in a family" }, { status: 409 });
  }

  const { inviteCode } = await req.json();
  if (!inviteCode?.trim()) {
    return NextResponse.json({ error: "Invite code required" }, { status: 400 });
  }

  const family = await db
    .select()
    .from(families)
    .where(eq(families.inviteCode, inviteCode.trim().toUpperCase()))
    .limit(1);

  if (!family[0]) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  const memberCount = await db
    .select()
    .from(familyMembers)
    .where(eq(familyMembers.familyId, family[0].id));

  if (memberCount.length >= MAX_MEMBERS) {
    return NextResponse.json({ error: "Family is full (max 6 members)" }, { status: 409 });
  }

  await db.insert(familyMembers).values({
    familyId: family[0].id,
    userId: user.id,
    role: "member",
  });

  return NextResponse.json({ family: family[0] }, { status: 200 });
}
