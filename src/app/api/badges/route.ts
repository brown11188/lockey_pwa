import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badges, entries } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";
import { getLevelInfo } from "@/lib/badge-definitions";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const [userBadges, totalCount] = await Promise.all([
    db.select().from(badges).where(eq(badges.userId, user.id)),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(entries)
      .where(eq(entries.userId, user.id))
      .then((rows) => rows[0]),
  ]);

  const levelInfo = getLevelInfo(totalCount?.count ?? 0);

  return NextResponse.json({
    badges: userBadges.map((b) => ({
      badgeId: b.badgeId,
      earnedAt: b.earnedAt,
    })),
    totalExpenses: totalCount?.count ?? 0,
    level: levelInfo,
  });
}
