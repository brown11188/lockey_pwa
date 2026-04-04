"use client";

import { memo } from "react";
import { getCategoryInfo } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";

const CATEGORY_COLORS: Record<string, string> = {
  food: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  shopping: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  transport: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  entertainment: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  health: "bg-green-500/20 text-green-300 border-green-500/30",
  housing: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  education: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  travel: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  work: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  gifts: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  bills: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  pets: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  other: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

export const CategoryBadge = memo(function CategoryBadge({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const { t } = useLanguage();
  const info = getCategoryInfo(category, t.categories);
  const colors = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        colors,
        className
      )}
    >
      {info.emoji} {info.label}
    </span>
  );
}
);
CategoryBadge.displayName = "CategoryBadge";
