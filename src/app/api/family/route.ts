import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { families, familyMembers, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";
import { getUserFamily, generateInviteCode } from "@/lib/family-utils";

export const dynamic = "force-dynamic";

const MAX_MEMBERS = 6;

// GET /api/family — get current user's family + members
export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const row = await getUserFamily(user.id);
  if (!row) return NextResponse.json(null);

  const members = await db
    .select({
      id: familyMembers.id,
      userId: familyMembers.userId,
      role: familyMembers.role,
      isPrivate: familyMembers.isPrivate,
      joinedAt: familyMembers.joinedAt,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(familyMembers)
    .innerJoin(users, eq(familyMembers.userId, users.id))
    .where(eq(familyMembers.familyId, row.family.id));

  return NextResponse.json({ family: row.family, members });
}

// POST /api/family — create a new family
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const existing = await getUserFamily(user.id);
  if (existing) {
    return NextResponse.json({ error: "Already in a family" }, { status: 409 });
  }

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Family name required" }, { status: 400 });
  }

  const inviteCode = generateInviteCode();
  const familyId = crypto.randomUUID();

  await db.insert(families).values({
    id: familyId,
    name: name.trim(),
    ownerId: user.id,
    inviteCode,
  });

  await db.insert(familyMembers).values({
    familyId,
    userId: user.id,
    role: "owner",
  });

  const family = await db.select().from(families).where(eq(families.id, familyId)).limit(1);
  return NextResponse.json({ family: family[0] }, { status: 201 });
}

// PATCH /api/family — owner updates name or budget
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const row = await getUserFamily(user.id);
  if (!row) return NextResponse.json({ error: "Not in a family" }, { status: 404 });
  if (row.member.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });

  const { name, monthlyBudget, budgetCurrency } = await req.json();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) updates.name = name.trim();
  if (monthlyBudget !== undefined) updates.monthlyBudget = monthlyBudget === "" ? null : parseFloat(monthlyBudget);
  if (budgetCurrency !== undefined) updates.budgetCurrency = budgetCurrency;

  await db.update(families).set(updates).where(eq(families.id, row.family.id));
  return NextResponse.json({ success: true });
}

// DELETE /api/family — owner deletes family
export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const row = await getUserFamily(user.id);
  if (!row) return NextResponse.json({ error: "Not in a family" }, { status: 404 });
  if (row.member.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });

  await db.delete(families).where(eq(families.id, row.family.id));
  return NextResponse.json({ success: true });
}
