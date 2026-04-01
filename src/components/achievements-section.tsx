"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { BADGE_DEFINITIONS, getLevelInfo } from "@/lib/badge-definitions";
import { cn } from "@/lib/utils";
import {
  Trophy as TrophyIcon,
  Lock as LockIcon,
  Flame as FlameIcon,
} from "lucide-react";

interface BadgeData {
  badgeId: string;
  earnedAt: Date | null;
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastLoggedDate: string | null;
  missedYesterday: boolean;
}

export function AchievementsSection() {
  const { t } = useLanguage();
  const [badgesList, setBadgesList] = useState<BadgeData[]>([]);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [badgesRes, streakRes] = await Promise.all([
        apiFetch("/api/badges"),
        apiFetch("/api/streak"),
      ]);
      if (badgesRes.ok) {
        const data = await badgesRes.json();
        setBadgesList(data.badges);
        setTotalExpenses(data.totalExpenses);
      }
      if (streakRes.ok) {
        setStreakData(await streakRes.json());
      }
    } catch {
      console.error("Failed to fetch achievements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const earnedSet = new Set(badgesList.map((b) => b.badgeId));
  const levelInfo = getLevelInfo(totalExpenses);
  const xpProgress = Math.min(
    ((totalExpenses - levelInfo.min) / (levelInfo.max - levelInfo.min + 1)) * 100,
    100
  );

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Streak Card */}
      {streakData && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
              <FlameIcon className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-white">{t.streak.title}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-400">
                  {t.streak.currentStreak}:{" "}
                  <span className="font-bold text-amber-400">
                    {t.streak.days.replace("{count}", String(streakData.currentStreak))}
                  </span>
                </span>
                <span className="text-sm text-gray-500">
                  {t.streak.longestStreak}:{" "}
                  <span className="font-semibold text-gray-300">
                    {t.streak.days.replace("{count}", String(streakData.longestStreak))}
                  </span>
                </span>
              </div>
            </div>
          </div>
          {streakData.missedYesterday && streakData.currentStreak === 0 && (
            <p className="mt-3 text-xs text-amber-400/70">{t.streak.missedDay}</p>
          )}
        </div>
      )}

      {/* Level Card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{levelInfo.emoji}</span>
            <div>
              <p className="text-xs text-gray-500">{t.badges.level} {levelInfo.level}</p>
              <p className="font-semibold text-white">{t.badges.levels[levelInfo.name]}</p>
            </div>
          </div>
          <span className="text-xs text-gray-500">
            {totalExpenses} {t.badges.xp}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>

      {/* Badge Grid */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-400">
          <TrophyIcon className="h-4 w-4" />
          {t.badges.title}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {BADGE_DEFINITIONS.map((def) => {
            const isEarned = earnedSet.has(def.id);
            const earned = badgesList.find((b) => b.badgeId === def.id);
            const nameText =
              def.nameKey in t.badges
                ? (t.badges as unknown as Record<string, string>)[def.nameKey]
                : def.requirement;

            return (
              <div
                key={def.id}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 text-center transition-all",
                  isEarned
                    ? "border-amber-500/20 bg-amber-500/5"
                    : "border-white/5 bg-white/[0.02] opacity-50"
                )}
              >
                <span className={cn("text-3xl", !isEarned && "grayscale")}>
                  {def.emoji}
                </span>
                <span className="text-[10px] leading-tight text-gray-400 line-clamp-2">
                  {nameText}
                </span>
                {isEarned && earned?.earnedAt && (
                  <span className="text-[9px] text-amber-500/60">
                    {new Date(earned.earnedAt).toLocaleDateString()}
                  </span>
                )}
                {!isEarned && (
                  <div className="absolute right-1.5 top-1.5">
                    <LockIcon className="h-3 w-3 text-gray-600" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
