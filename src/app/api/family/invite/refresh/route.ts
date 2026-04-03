import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { families } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";
import { getUserFamily, generateInviteCode } from "@/lib/family-utils";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const row = await getUserFamily(user.id);
  if (!row) return NextResponse.json({ error: "Not in a family" }, { status: 404 });
  if (row.member.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });

  const newCode = generateInviteCode();
  await db
    .update(families)
    .set({ inviteCode: newCode, updatedAt: new Date() })
    .where(eq(families.id, row.family.id));

  return NextResponse.json({ inviteCode: newCode });
}
