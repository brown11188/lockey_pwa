import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { streaks, entries, badges } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";
import { STREAK_MILESTONES } from "@/lib/badge-definitions";

export const dynamic = "force-dynamic";

function getTodayStr(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// GET - retrieve current streak info
export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  let [streak] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, user.id))
    .limit(1);

  if (!streak) {
    await db.insert(streaks).values({ userId: user.id });
    [streak] = await db
      .select()
      .from(streaks)
      .where(eq(streaks.userId, user.id))
      .limit(1);
  }

  const today = getTodayStr();
  const yesterday = getYesterdayStr();

  // Auto-reset streak if user missed yesterday
  if (
    streak &&
    streak.lastLoggedDate &&
    streak.lastLoggedDate !== today &&
    streak.lastLoggedDate !== yesterday &&
    streak.currentStreak > 0
  ) {
    await db
      .update(streaks)
      .set({ currentStreak: 0 })
      .where(eq(streaks.userId, user.id));
    streak = { ...streak, currentStreak: 0 };
  }

  const missedYesterday =
    streak?.lastLoggedDate !== undefined &&
    streak.lastLoggedDate !== today &&
    streak.lastLoggedDate !== yesterday &&
    streak.currentStreak === 0;

  return NextResponse.json({
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
    lastLoggedDate: streak?.lastLoggedDate ?? null,
    missedYesterday,
  });
}

// POST - update streak after saving an expense. Returns milestone if hit.
export async function POST() {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const today = getTodayStr();
  const yesterday = getYesterdayStr();

  let [streak] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, user.id))
    .limit(1);

  if (!streak) {
    const inserted = await db
      .insert(streaks)
      .values({ userId: user.id, currentStreak: 0, longestStreak: 0 })
      .returning();
    streak = inserted[0];
  }

  // Already logged today
  if (streak.lastLoggedDate === today) {
    return NextResponse.json({
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      milestone: null,
      newBadges: [],
    });
  }

  const newStreak = streak.lastLoggedDate === yesterday ? streak.currentStreak + 1 : 1;
  const newLongest = Math.max(streak.longestStreak, newStreak);

  await db
    .update(streaks)
    .set({ currentStreak: newStreak, longestStreak: newLongest, lastLoggedDate: today })
    .where(eq(streaks.userId, user.id));

  const milestone = STREAK_MILESTONES.find((m) => m.days === newStreak) ?? null;
  const newBadges: string[] = [];

  const hasBadge = async (badgeId: string) => {
    const [row] = await db
      .select()
      .from(badges)
      .where(and(eq(badges.userId, user.id), eq(badges.badgeId, badgeId)))
      .limit(1);
    return !!row;
  };
  const awardBadge = async (badgeId: string) => {
    if (!(await hasBadge(badgeId))) {
      await db.insert(badges).values({ userId: user.id, badgeId });
      newBadges.push(badgeId);
    }
  };

  // first_expense badge
  const [totalEntries] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(entries)
    .where(eq(entries.userId, user.id));
  if (totalEntries && totalEntries.count >= 1) await awardBadge("first_expense");

  // streak badges
  if (newStreak >= 7) await awardBadge("streak_7");
  if (newStreak >= 30) await awardBadge("streak_30");

  // photos_50
  const [photoCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(entries)
    .where(and(eq(entries.userId, user.id), sql`${entries.photoId} IS NOT NULL`));
  if (photoCount && photoCount.count >= 50) await awardBadge("photos_50");

  // food_lover (10 food entries this month)
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-01`;
  const monthEnd = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-31`;

  const [foodCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(entries)
    .where(
      and(
        eq(entries.userId, user.id),
        eq(entries.category, "food"),
        sql`(${entries.createdAt})::date >= ${monthStart}::date AND (${entries.createdAt})::date <= ${monthEnd}::date`
      )
    );
  if (foodCount && foodCount.count >= 10) await awardBadge("food_lover");

  // traveler (3 travel entries)
  const [travelCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(entries)
    .where(and(eq(entries.userId, user.id), eq(entries.category, "travel")));
  if (travelCount && travelCount.count >= 3) await awardBadge("traveler");

  // gamer (5 entertainment entries)
  const [gameCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(entries)
    .where(and(eq(entries.userId, user.id), eq(entries.category, "entertainment")));
  if (gameCount && gameCount.count >= 5) await awardBadge("gamer");

  return NextResponse.json({
    currentStreak: newStreak,
    longestStreak: newLongest,
    milestone: milestone ? { days: milestone.days, key: milestone.key, emoji: milestone.emoji } : null,
    newBadges,
  });
}
