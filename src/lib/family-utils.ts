import { db } from "@/lib/db";
import { families, familyMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Returns the family + member row for the current user, or null if not in a family. */
export async function getUserFamily(userId: string) {
  const rows = await db
    .select({
      family: families,
      member: familyMembers,
    })
    .from(familyMembers)
    .innerJoin(families, eq(familyMembers.familyId, families.id))
    .where(eq(familyMembers.userId, userId))
    .limit(1);

  return rows[0] ?? null;
}

/** Returns the member row for a given user + family, or null. */
export async function getFamilyMember(familyId: string, userId: string) {
  const rows = await db
    .select()
    .from(familyMembers)
    .where(and(eq(familyMembers.familyId, familyId), eq(familyMembers.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}
