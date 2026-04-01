"use client";

import { useLanguage } from "@/lib/language-context";
import { Flame as FlameIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  currentStreak: number;
  className?: string;
}

export function StreakBadge({ currentStreak, className }: StreakBadgeProps) {
  const { t } = useLanguage();

  if (currentStreak <= 0) {
    return (
      <div className={cn("flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-gray-500", className)}>
        <span>🌱</span>
        <span>{t.streak.startToday}</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400", className)}>
      <FlameIcon className="h-3.5 w-3.5 drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]" />
      <span>{t.streak.days.replace("{count}", String(currentStreak))}</span>
    </div>
  );
}
