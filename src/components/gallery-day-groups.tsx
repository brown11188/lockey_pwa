"use client";

import { PhotoCard } from "@/components/photo-card";
import { PhotoGroupStack } from "@/components/photo-group-stack";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
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

export function GalleryDayGroups({
  groups,
  stickyHeader = false,
  onSelectEntry,
  onDeleteEntry,
}: GalleryDayGroupsProps) {
  const { currency } = useCurrency();

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.date}>
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
