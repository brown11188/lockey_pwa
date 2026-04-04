"use client";

import { memo, useMemo } from "react";
import { Zap as ZapIcon, CalendarDays as CalendarDaysIcon, ReceiptText as ReceiptTextIcon, Wallet as WalletIcon } from "lucide-react";
import { MonthCalendar, type CalendarDayMeta } from "@/components/month-calendar";
import { formatCurrency, getMonthKey } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { useLanguage } from "@/lib/language-context";
import type { Entry } from "@/db/schema";

interface HistoryCalendarPanelProps {
  selectedDate: string;
  markedDates: Set<string>;
  allEntries: Entry[];
  onSelectDate: (value: string) => void;
}

export const HistoryCalendarPanel = memo(function HistoryCalendarPanel({
  selectedDate,
  markedDates,
  allEntries,
  onSelectDate,
}: HistoryCalendarPanelProps) {
  const { currency } = useCurrency();
  const { t } = useLanguage();

  const selectedMonthKey = getMonthKey(`${selectedDate}T12:00:00`);

  const monthEntries = useMemo(
    () => allEntries.filter((entry) => getMonthKey(entry.createdAt) === selectedMonthKey),
    [allEntries, selectedMonthKey]
  );

  const dayMeta = useMemo(() => monthEntries.reduce<Record<string, CalendarDayMeta>>((acc, entry) => {
    const dateKey = entry.createdAt.slice(0, 10);
    const current = acc[dateKey] ?? { amount: 0, count: 0, photos: [] };
    const photos = current.photos ?? [];
    acc[dateKey] = {
      amount: current.amount + entry.amount,
      count: current.count + 1,
      photos: entry.photoUri && photos.length < 3 ? [...photos, entry.photoUri] : photos,
    };
    return acc;
  }, {}), [monthEntries]);

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
            1\u20132 = normal, 3+ = hot
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
          <p className="mt-3 text-sm font-bold text-white">{peakDay ? peakDay[0] : "\u2014"}</p>
          <p className="mt-1 text-xs text-gray-500">{peakDay ? formatCurrency(peakDay[1].amount, currency) : ""}</p>
        </div>
      </section>
    </div>
  );
});
