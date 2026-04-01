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

  let streak = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, user.id))
    .get();

  if (!streak) {
    await db.insert(streaks).values({ userId: user.id });
    streak = await db
      .select()
      .from(streaks)
      .where(eq(streaks.userId, user.id))
      .get();
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

  // Check if user missed yesterday for the UI hint
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

  let streak = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, user.id))
    .get();

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

  let newStreak: number;
  if (streak.lastLoggedDate === yesterday) {
    newStreak = streak.currentStreak + 1;
  } else {
    newStreak = 1;
  }

  const newLongest = Math.max(streak.longestStreak, newStreak);

  await db
    .update(streaks)
    .set({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastLoggedDate: today,
    })
    .where(eq(streaks.userId, user.id));

  // Check milestones
  const milestone = STREAK_MILESTONES.find((m) => m.days === newStreak) ?? null;

  // Award badges for streak milestones
  const newBadges: string[] = [];

  // first_expense badge
  const totalEntries = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(entries)
    .where(eq(entries.userId, user.id))
    .get();
  if (totalEntries && totalEntries.count >= 1) {
    const existing = await db
      .select()
      .from(badges)
      .where(and(eq(badges.userId, user.id), eq(badges.badgeId, "first_expense")))
      .get();
    if (!existing) {
      await db.insert(badges).values({ userId: user.id, badgeId: "first_expense" });
      newBadges.push("first_expense");
    }
  }

  // streak_7
  if (newStreak >= 7) {
    const existing = await db
      .select()
      .from(badges)
      .where(and(eq(badges.userId, user.id), eq(badges.badgeId, "streak_7")))
      .get();
    if (!existing) {
      await db.insert(badges).values({ userId: user.id, badgeId: "streak_7" });
      newBadges.push("streak_7");
    }
  }

  // streak_30
  if (newStreak >= 30) {
    const existing = await db
      .select()
      .from(badges)
      .where(and(eq(badges.userId, user.id), eq(badges.badgeId, "streak_30")))
      .get();
    if (!existing) {
      await db.insert(badges).values({ userId: user.id, badgeId: "streak_30" });
      newBadges.push("streak_30");
    }
  }

  // photos_50
  const photoCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(entries)
    .where(and(eq(entries.userId, user.id), sql`${entries.photoId} IS NOT NULL`))
    .get();
  if (photoCount && photoCount.count >= 50) {
    const existing = await db
      .select()
      .from(badges)
      .where(and(eq(badges.userId, user.id), eq(badges.badgeId, "photos_50")))
      .get();
    if (!existing) {
      await db.insert(badges).values({ userId: user.id, badgeId: "photos_50" });
      newBadges.push("photos_50");
    }
  }

  // Category badges: food_lover (10 food entries this month)
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-01`;
  const monthEnd = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-31`;

  const foodCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(entries)
    .where(
      and(
        eq(entries.userId, user.id),
        eq(entries.category, "food"),
        sql`date(${entries.createdAt}) >= ${monthStart} AND date(${entries.createdAt}) <= ${monthEnd}`
      )
    )
    .get();
  if (foodCount && foodCount.count >= 10) {
    const existing = await db
      .select()
      .from(badges)
      .where(and(eq(badges.userId, user.id), eq(badges.badgeId, "food_lover")))
      .get();
    if (!existing) {
      await db.insert(badges).values({ userId: user.id, badgeId: "food_lover" });
      newBadges.push("food_lover");
    }
  }

  // traveler (3 travel entries)
  const travelCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(entries)
    .where(and(eq(entries.userId, user.id), eq(entries.category, "travel")))
    .get();
  if (travelCount && travelCount.count >= 3) {
    const existing = await db
      .select()
      .from(badges)
      .where(and(eq(badges.userId, user.id), eq(badges.badgeId, "traveler")))
      .get();
    if (!existing) {
      await db.insert(badges).values({ userId: user.id, badgeId: "traveler" });
      newBadges.push("traveler");
    }
  }

  // gamer (5 entertainment entries)
  const gameCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(entries)
    .where(and(eq(entries.userId, user.id), eq(entries.category, "entertainment")))
    .get();
  if (gameCount && gameCount.count >= 5) {
    const existing = await db
      .select()
      .from(badges)
      .where(and(eq(badges.userId, user.id), eq(badges.badgeId, "gamer")))
      .get();
    if (!existing) {
      await db.insert(badges).values({ userId: user.id, badgeId: "gamer" });
      newBadges.push("gamer");
    }
  }

  return NextResponse.json({
    currentStreak: newStreak,
    longestStreak: newLongest,
    milestone: milestone ? { days: milestone.days, key: milestone.key, emoji: milestone.emoji } : null,
    newBadges,
  });
}
