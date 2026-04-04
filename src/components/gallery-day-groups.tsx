"use client";

import { useState } from "react";
import { PhotoCard } from "@/components/photo-card";
import { PhotoGroupStack } from "@/components/photo-group-stack";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { useLanguage } from "@/lib/language-context";
import { getEntryPhotoUrl } from "@/lib/entry-photo";
import { getCategoryInfo } from "@/lib/constants";
import type { Entry } from "@/db/schema";

export interface EntryGroup {
  date: string;
  label: string;
  entries: Entry[];
  total: number;
}

interface GalleryDayGroupsProps {
  groups: EntryGroup[];
  stickyHeader?: boolean;
  onSelectEntry: (entry: Entry) => void;
  onDeleteEntry: (entry: Entry) => void;
}

// Rotation/offset for each card in the stack (back → front)
const STACK_LAYERS = [
  { rotate: -9, x: -28, y: 4, scale: 0.88 },
  { rotate: 5, x: 14, y: 2, scale: 0.93 },
  { rotate: -2, x: 0, y: 0, scale: 1 },
] as const;

function PhotoStackGroup({
  group,
  stickyHeader,
  onSelectEntry,
  onDeleteEntry,
}: {
  group: EntryGroup;
  stickyHeader?: boolean;
  onSelectEntry: (entry: Entry) => void;
  onDeleteEntry: (entry: Entry) => void;
}) {
  const { currency } = useCurrency();
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const showStack = group.entries.length >= 3 && !expanded;

  return (
    <div>
      <div
        className={`mb-3 flex items-center justify-between rounded-xl bg-gray-900/80 px-3 py-2 backdrop-blur-sm ${
          stickyHeader ? "sticky top-[105px] z-10" : ""
        }`}
      >
        <span className="text-sm font-semibold text-white">{group.label}</span>
        <span className="text-sm font-bold text-amber-400">
          {formatCurrency(group.total, currency)}
        </span>
      </div>

      {showStack ? (
        <button
          type="button"
          className="group w-full"
          onClick={() => setExpanded(true)}
        >
          {/* Photo pile */}
          <div className="relative flex h-56 items-center justify-center">
            {group.entries.slice(0, 3).map((entry, idx) => {
              const photoUrl = getEntryPhotoUrl(entry);
              const catInfo = getCategoryInfo(entry.category);
              const { rotate, x, y, scale } = STACK_LAYERS[idx];
              return (
                <div
                  key={entry.id}
                  className="absolute h-44 w-36 overflow-hidden rounded-2xl border-2 border-white/20 bg-gray-800 shadow-2xl transition-transform duration-300 group-hover:scale-105"
                  style={{
                    transform: `translateX(${x}px) translateY(${y}px) rotate(${rotate}deg) scale(${scale})`,
                    zIndex: idx + 1,
                  }}
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-800 to-gray-900">
                      <span className="text-5xl">{catInfo.emoji}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {group.entries.filter((e) => e.photoUri || e.photoId).length >= 2 ? (
            <PhotoGroupStack
              entries={group.entries}
              onSelectEntry={onSelectEntry}
              onDeleteEntry={onDeleteEntry}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {group.entries.map((entry) => (
                <PhotoCard
                  key={entry.id}
                  entry={entry}
                  onClick={() => onSelectEntry(entry)}
                  onLongPress={() => onDeleteEntry(entry)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
