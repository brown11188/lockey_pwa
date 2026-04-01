"use client";

import { useCallback, useMemo, useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from "lucide-react";

export interface CalendarDayMeta {
  amount: number;
  count: number;
}

interface MonthCalendarProps {
  value: string;
  onChange: (value: string) => void;
  markedDates?: Set<string>;
  dayMeta?: Record<string, CalendarDayMeta>;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function parseDateKey(value: string): { year: number; month: number; day: number } {
  if (!value) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  }

  const [year, month, day] = value.split("-").map(Number);
  return { year, month: month - 1, day };
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function getMonthFromIndex(monthIndex: number): { year: number; month: number } {
  const year = Math.floor(monthIndex / 12);
  const month = ((monthIndex % 12) + 12) % 12;
  return { year, month };
}

export function MonthCalendar({ value, onChange, markedDates, dayMeta }: MonthCalendarProps) {
  const { t } = useLanguage();
  const selected = useMemo(() => parseDateKey(value), [value]);
  const [monthOffset, setMonthOffset] = useState(0);

  const selectedMonthIndex = selected.year * 12 + selected.month;
  const displayMonthIndex = selectedMonthIndex + monthOffset;
  const { year: viewYear, month: viewMonth } = getMonthFromIndex(displayMonthIndex);

  const prevMonth = useCallback(() => {
    setMonthOffset((current) => current - 1);
  }, []);

  const nextMonth = useCallback(() => {
    setMonthOffset((current) => current + 1);
  }, []);

  const selectDate = useCallback(
    (dateKey: string) => {
      setMonthOffset(0);
      onChange(dateKey);
    },
    [onChange]
  );

  const goToToday = useCallback(() => {
    const now = new Date();
    const dateKey = toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
    setMonthOffset(0);
    onChange(dateKey);
  }, [onChange]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const rows = Math.ceil((firstDay + daysInMonth) / 7);
  const today = new Date();
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={goToToday}
          className="text-sm font-semibold text-white transition-colors hover:text-amber-400"
        >
          {t.dateTime.months[viewMonth]} {viewYear}
        </button>
        <button
          type="button"
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {t.dateTime.daysOfWeek.map((day) => (
          <div key={day} className="py-1 text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: rows * 7 }, (_, index) => {
          const day = index - firstDay + 1;
          if (day < 1 || day > daysInMonth) {
            return <div key={index} className="h-10" />;
          }

          const dateKey = toDateKey(viewYear, viewMonth, day);
          const isSelected = dateKey === value;
          const isToday = dateKey === todayKey;
          const meta = dayMeta?.[dateKey];
          const isMarked = markedDates?.has(dateKey) ?? false;
          const hasSpending = (meta?.amount ?? 0) > 0;
          const isHighSpend = (meta?.count ?? 0) >= 3 || (meta?.amount ?? 0) >= 500000;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => selectDate(dateKey)}
              className={`relative flex h-14 w-full flex-col items-center justify-center rounded-xl border text-sm font-medium transition-all ${
                isSelected
                  ? "border-amber-400 bg-amber-500 font-bold text-gray-950 shadow-[0_0_0_1px_rgba(245,158,11,0.2)]"
                  : isHighSpend
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15"
                    : hasSpending
                      ? "border-emerald-500/20 bg-emerald-500/8 text-white hover:bg-emerald-500/12"
                      : isToday
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                        : "border-transparent text-gray-300 hover:bg-white/10"
              }`}
            >
              <span>{day}</span>
              {meta ? (
                <span className={`mt-1 text-[10px] leading-none ${isSelected ? "text-gray-900/80" : "text-gray-400"}`}>
                  {meta.count}
                </span>
              ) : null}
              {isMarked && !isSelected ? (
                <span
                  className={`absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
                    isHighSpend ? "bg-rose-400" : "bg-emerald-400"
                  }`}
                />
              ) : null}
              {isToday && !isSelected && !isMarked ? (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-amber-400" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
