"use client";

import { memo } from "react";
import { CategoryBadge } from "@/components/category-badge";
import { formatCurrency, formatTime } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { getEntryPhotoUrl } from "@/lib/entry-photo";
import { getCategoryInfo } from "@/lib/constants";
import type { Entry } from "@/db/schema";

export const PhotoCard = memo(function PhotoCard({
  entry,
  onClick,
  onLongPress,
}: {
  entry: Entry;
  onClick: () => void;
  onLongPress?: () => void;
}) {
  const { currency } = useCurrency();
  let pressTimer: ReturnType<typeof setTimeout> | null = null;

  const handleTouchStart = () => {
    if (onLongPress) {
      pressTimer = setTimeout(onLongPress, 600);
    }
  };

  const handleTouchEnd = () => {
    if (pressTimer) clearTimeout(pressTimer);
  };

  const photoUrl = getEntryPhotoUrl(entry);
  const catInfo = getCategoryInfo(entry.category);

  return (
    <button
      type="button"
      className="group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all hover:border-amber-500/30 hover:bg-white/10 text-left"
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      <div className="aspect-square w-full overflow-hidden bg-gray-900">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={entry.note || "Expense photo"}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-800/80 to-gray-900">
            <span className="text-4xl">{catInfo.emoji}</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-amber-400">
            {formatCurrency(entry.amount, currency)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <CategoryBadge category={entry.category} />
          <span className="text-xs text-gray-500">
            {formatTime(entry.createdAt)}
          </span>
        </div>
      </div>
    </button>
  );
});
PhotoCard.displayName = "PhotoCard";
