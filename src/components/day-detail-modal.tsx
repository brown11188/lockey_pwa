"use client";

import Link from "next/link";
import { X as XIcon, Plus as PlusIcon } from "lucide-react";
import { PhotoCard } from "@/components/photo-card";
import { PhotoGroupStack } from "@/components/photo-group-stack";
import { formatCurrency, formatDateGroup } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { useLanguage } from "@/lib/language-context";
import type { Entry } from "@/db/schema";

interface DayDetailModalProps {
  open: boolean;
  onClose: () => void;
  selectedDate: string;
  selectedEntries: Entry[];
  onSelectEntry: (entry: Entry) => void;
  onDeleteEntry: (entry: Entry) => void;
}

export function DayDetailModal({
  open,
  onClose,
  selectedDate,
  selectedEntries,
  onSelectEntry,
  onDeleteEntry,
}: DayDetailModalProps) {
  const { currency } = useCurrency();
  const { t } = useLanguage();

  if (!open) return null;

  const selectedTotal = selectedEntries.reduce((sum, e) => sum + e.amount, 0);
  const addEntryHref = `/camera?dateTime=${encodeURIComponent(`${selectedDate}T12:00`)}`;

  const handleSelectEntry = (entry: Entry) => {
    onSelectEntry(entry);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {t.gallery.selectedDate}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">
              {formatDateGroup(`${selectedDate}T12:00:00`, t.dateTime)}
            </h3>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-amber-400">
                {formatCurrency(selectedTotal, currency)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {selectedEntries.length} {t.gallery.entryCountSuffix}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-gray-400 hover:text-white"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-8">
          <Link
            href={addEntryHref}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-gray-950 transition-all hover:bg-amber-400"
          >
            <PlusIcon className="h-4 w-4" />
            {t.gallery.addEntryOnDate}
          </Link>

          {selectedEntries.length > 0 ? (
            <div className="mt-4">
              {selectedEntries.filter((e) => e.photoUri || e.photoId).length >= 2 ? (
                <PhotoGroupStack
                  entries={selectedEntries}
                  onSelectEntry={handleSelectEntry}
                  onDeleteEntry={onDeleteEntry}
                />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {selectedEntries.map((entry) => (
                    <PhotoCard
                      key={entry.id}
                      entry={entry}
                      onClick={() => handleSelectEntry(entry)}
                      onLongPress={() => onDeleteEntry(entry)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-gray-950/50 px-4 py-6 text-center">
              <p className="text-sm font-medium text-gray-300">{t.gallery.noEntriesOnDate}</p>
              <p className="mt-1 text-sm text-gray-500">{t.gallery.noEntriesOnDateHint}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
