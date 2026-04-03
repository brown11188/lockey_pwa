import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { familyMembers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";
import { getUserFamily } from "@/lib/family-utils";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const row = await getUserFamily(user.id);
  if (!row) return NextResponse.json({ error: "Not in a family" }, { status: 404 });
  if (row.member.role === "owner") {
    return NextResponse.json(
      { error: "Transfer ownership before leaving" },
      { status: 409 }
    );
  }

  await db
    .delete(familyMembers)
    .where(
      and(
        eq(familyMembers.familyId, row.family.id),
        eq(familyMembers.userId, user.id)
      )
    );

  return NextResponse.json({ success: true });
}
