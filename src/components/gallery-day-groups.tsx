"use client";

import { memo } from "react";
import { PhotoCard } from "@/components/photo-card";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { useLanguage } from "@/lib/language-context";
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
    </div>
  );
}

export const GalleryDayGroups = memo(function GalleryDayGroups({
  groups,
  stickyHeader,
  onSelectEntry,
  onDeleteEntry,
}: GalleryDayGroupsProps) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <PhotoStackGroup
          key={group.date}
          group={group}
          stickyHeader={stickyHeader}
          onSelectEntry={onSelectEntry}
          onDeleteEntry={onDeleteEntry}
        />
      ))}
    </div>
  );
});
GalleryDayGroups.displayName = "GalleryDayGroups";
