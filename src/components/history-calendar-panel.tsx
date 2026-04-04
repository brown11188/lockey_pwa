"use client";

import Link from "next/link";
import { Plus as PlusIcon, Zap as ZapIcon, CalendarDays as CalendarDaysIcon, ReceiptText as ReceiptTextIcon, Wallet as WalletIcon } from "lucide-react";
import { MonthCalendar, type CalendarDayMeta } from "@/components/month-calendar";
import { PhotoCard } from "@/components/photo-card";
import { PhotoGroupStack } from "@/components/photo-group-stack";
import { formatCurrency, formatDateGroup, getMonthKey } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { useLanguage } from "@/lib/language-context";
import type { Entry } from "@/db/schema";

interface HistoryCalendarPanelProps {
  selectedDate: string;
  markedDates: Set<string>;
  selectedEntries: Entry[];
  allEntries: Entry[];
  onSelectDate: (value: string) => void;
  onSelectEntry: (entry: Entry) => void;
  onDeleteEntry: (entry: Entry) => void;
}

export function HistoryCalendarPanel({
  selectedDate,
  markedDates,
  selectedEntries,
  allEntries,
  onSelectDate,
  onSelectEntry,
  onDeleteEntry,
}: HistoryCalendarPanelProps) {
  const { currency } = useCurrency();
  const { t } = useLanguage();

  const selectedTotal = selectedEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const addEntryHref = `/camera?dateTime=${encodeURIComponent(`${selectedDate}T12:00`)}`;
  const selectedMonthKey = getMonthKey(`${selectedDate}T12:00:00`);

  const monthEntries = allEntries.filter((entry) => getMonthKey(entry.createdAt) === selectedMonthKey);
  const dayMeta = monthEntries.reduce<Record<string, CalendarDayMeta>>((acc, entry) => {
    const dateKey = entry.createdAt.slice(0, 10);
    const current = acc[dateKey] ?? { amount: 0, count: 0, photos: [] };
    const photos = current.photos ?? [];
    acc[dateKey] = {
      amount: current.amount + entry.amount,
      count: current.count + 1,
      // Collect up to 3 photo URIs per day for the thumbnail stack
      photos: entry.photoUri && photos.length < 3 ? [...photos, entry.photoUri] : photos,
    };
    return acc;
  }, {});

  const activeDays = Object.keys(dayMeta).length;
  const monthTotal = monthEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const peakDay = Object.entries(dayMeta).sort((a, b) => b[1].amount - a[1].amount)[0];
  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-400">{t.gallery.historyCalendar}</h2>
        <MonthCalendar
          value={selectedDate}
          onChange={onSelectDate}
          markedDates={markedDates}
          dayMeta={dayMeta}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>{t.gallery.activeDays}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <span>{t.gallery.highSpendDays}</span>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
            1–2 = normal, 3+ = hot
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-gray-400">
            <CalendarDaysIcon className="h-4 w-4" />
            <span className="text-xs font-medium">{t.gallery.daysTracked}</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-white">{activeDays}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-gray-400">
            <ReceiptTextIcon className="h-4 w-4" />
            <span className="text-xs font-medium">{t.gallery.entriesCount}</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-white">{monthEntries.length}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-gray-400">
            <WalletIcon className="h-4 w-4" />
            <span className="text-xs font-medium">{t.gallery.monthTotal}</span>
          </div>
          <p className="mt-3 text-lg font-bold text-amber-400">{formatCurrency(monthTotal, currency)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-gray-400">
            <ZapIcon className="h-4 w-4" />
            <span className="text-xs font-medium">{t.gallery.peakDay}</span>
          </div>
          <p className="mt-3 text-sm font-bold text-white">{peakDay ? peakDay[0] : "—"}</p>
          <p className="mt-1 text-xs text-gray-500">{peakDay ? formatCurrency(peakDay[1].amount, currency) : ""}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {t.gallery.selectedDate}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-white">
              {formatDateGroup(`${selectedDate}T12:00:00`, t.dateTime)}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">{selectedDate}</p>
            <p className="mt-1 text-sm font-bold text-amber-400">
              {formatCurrency(selectedTotal, currency)}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {selectedEntries.length} {t.gallery.entryCountSuffix}
            </p>
          </div>
        </div>

        <Link
          href={addEntryHref}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-gray-950 transition-all hover:bg-amber-400"
        >
          <PlusIcon className="h-4 w-4" />
          {t.gallery.addEntryOnDate}
        </Link>

        {selectedEntries.length > 0 ? (
          <div className="mt-4">
            {selectedEntries.filter((e) => e.photoUri || e.photoId).length >= 2 ? (
              <PhotoGroupStack
                entries={selectedEntries}
                onSelectEntry={onSelectEntry}
                onDeleteEntry={onDeleteEntry}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {selectedEntries.map((entry) => (
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
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-gray-950/50 px-4 py-6 text-center">
            <p className="text-sm font-medium text-gray-300">{t.gallery.noEntriesOnDate}</p>
            <p className="mt-1 text-sm text-gray-500">{t.gallery.noEntriesOnDateHint}</p>
          </div>
        )}
      </section>
    </div>
  );
}
