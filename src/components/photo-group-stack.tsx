"use client";

import { useRef } from "react";
import { getEntryPhotoUrl } from "@/lib/entry-photo";
import { getCategoryInfo } from "@/lib/constants";
import { formatCurrency, formatTime } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import type { Entry } from "@/db/schema";

interface PhotoGroupStackProps {
  entries: Entry[];
  onSelectEntry: (entry: Entry) => void;
  onDeleteEntry?: (entry: Entry) => void;
}

export function PhotoGroupStack({ entries, onSelectEntry, onDeleteEntry }: PhotoGroupStackProps) {
  const { currency } = useCurrency();
  const pressTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const photosData = entries
    .map((e) => ({ entry: e, url: getEntryPhotoUrl(e) }))
    .filter((x) => x.url !== null) as { entry: Entry; url: string }[];

  if (photosData.length < 2) return null;

  const handleRowPressStart = (entry: Entry) => {
    if (!onDeleteEntry) return;
    const timer = setTimeout(() => onDeleteEntry(entry), 600);
    pressTimers.current.set(entry.id, timer);
  };

  const handleRowPressEnd = (entry: Entry) => {
    const timer = pressTimers.current.get(entry.id);
    if (timer) {
      clearTimeout(timer);
      pressTimers.current.delete(entry.id);
    }
  };

  return (
    <div className="space-y-2">
      {/* Photo stack hero */}
      <button
        type="button"
        className="group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-gray-900 text-left"
        onClick={() => onSelectEntry(entries[0])}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {/* Back photo (3rd) */}
          {photosData.length >= 3 && (
            <img
              src={photosData[2].url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ transform: "rotate(8deg) scale(0.9)", transformOrigin: "bottom center", zIndex: 1 }}
            />
          )}
          {/* Middle photo (2nd) */}
          {photosData.length >= 2 && (
            <img
              src={photosData[1].url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ transform: "rotate(4deg) scale(0.95)", transformOrigin: "bottom center", zIndex: 2 }}
            />
          )}
          {/* Front photo (1st) */}
          <img
            src={photosData[0].url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
            style={{ zIndex: 3 }}
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"
            style={{ zIndex: 4 }}
          />
          {/* Photo count badge */}
          <span
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm"
            style={{ zIndex: 5 }}
          >
            📸 {entries.length}
          </span>
        </div>
      </button>

      {/* Compact entry list */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {entries.map((entry, idx) => {
          const catInfo = getCategoryInfo(entry.category);
          return (
            <button
              key={entry.id}
              type="button"
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 ${
                idx < entries.length - 1 ? "border-b border-white/5" : ""
              }`}
              onClick={() => onSelectEntry(entry)}
              onTouchStart={() => handleRowPressStart(entry)}
              onTouchEnd={() => handleRowPressEnd(entry)}
              onMouseDown={() => handleRowPressStart(entry)}
              onMouseUp={() => handleRowPressEnd(entry)}
              onMouseLeave={() => handleRowPressEnd(entry)}
            >
              <span className="text-xl">{catInfo.emoji}</span>
              <span className="flex-1 text-sm font-bold text-amber-400">
                {formatCurrency(entry.amount, currency)}
              </span>
              <span className="text-xs text-gray-500">{formatTime(entry.createdAt)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
