"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useLanguage } from "@/lib/language-context";
import { MonthCalendar } from "@/components/month-calendar";
import {
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  ChevronLeft as ChevronLeftIcon,
} from "lucide-react";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function parseDT(str: string): { year: number; month: number; day: number; hour: number; minute: number } {
  if (!str) {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
      hour: now.getHours(),
      minute: now.getMinutes(),
    };
  }

  const [datePart, timePart] = str.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [h, min] = (timePart ?? "00:00").split(":").map(Number);
  return { year: y, month: m - 1, day: d, hour: h, minute: min };
}

function formatDT(year: number, month: number, day: number, hour: number, minute: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const parsed = useMemo(() => parseDT(value), [value]);

  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const setHour = useCallback(
    (hour: number) => {
      onChange(formatDT(parsed.year, parsed.month, parsed.day, hour, parsed.minute));
    },
    [onChange, parsed]
  );

  const setMinute = useCallback(
    (minute: number) => {
      onChange(formatDT(parsed.year, parsed.month, parsed.day, parsed.hour, minute));
    },
    [onChange, parsed]
  );

  const handleDateChange = useCallback(
    (dateKey: string) => {
      const [year, month, day] = dateKey.split("-").map(Number);
      onChange(formatDT(year, month - 1, day, parsed.hour, parsed.minute));
    },
    [onChange, parsed.hour, parsed.minute]
  );

  const displayDate = value
    ? new Date(parsed.year, parsed.month, parsed.day).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : t.capture.selectDate;

  const displayTime = value ? `${pad(parsed.hour)}:${pad(parsed.minute)}` : "--:--";
  const selectedDate = toDateKey(parsed.year, parsed.month, parsed.day);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-all hover:border-white/20 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
      >
        <CalendarIcon className="h-5 w-5 shrink-0 text-amber-400" />
        <div className="flex flex-1 items-center justify-between">
          <span className="text-white">{displayDate}</span>
          <div className="flex items-center gap-1.5 text-amber-400">
            <ClockIcon className="h-4 w-4" />
            <span className="font-mono text-sm font-semibold">{displayTime}</span>
          </div>
        </div>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-white/10 bg-gray-900 p-4 shadow-2xl shadow-black/50">
          <MonthCalendar value={selectedDate} onChange={handleDateChange} />

          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="flex items-center justify-center gap-2">
              <ClockIcon className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500">{t.dateTime.time}</span>
            </div>

            <div className="mt-2 flex items-center justify-center gap-1">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setHour((parsed.hour + 1) % 24)}
                  className="flex h-7 w-10 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5 rotate-90" />
                </button>
                <div className="flex h-12 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <span className="font-mono text-2xl font-bold text-amber-400">{pad(parsed.hour)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setHour((parsed.hour + 23) % 24)}
                  className="flex h-7 w-10 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5 -rotate-90" />
                </button>
              </div>

              <span className="px-1 text-2xl font-bold text-gray-500">:</span>

              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setMinute((parsed.minute + 1) % 60)}
                  className="flex h-7 w-10 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5 rotate-90" />
                </button>
                <div className="flex h-12 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <span className="font-mono text-2xl font-bold text-amber-400">{pad(parsed.minute)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMinute((parsed.minute + 59) % 60)}
                  className="flex h-7 w-10 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5 -rotate-90" />
                </button>
              </div>
            </div>

            <div className="mt-3 flex justify-center gap-1.5">
              {[0, 15, 30, 45].map((minute) => (
                <button
                  key={minute}
                  type="button"
                  onClick={() => setMinute(minute)}
                  className={`rounded-lg border px-3 py-1 text-xs font-medium transition-all ${
                    parsed.minute === minute
                      ? "border-amber-500/30 bg-amber-500/20 text-amber-300"
                      : "border-transparent bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                  }`}
                >
                  :{pad(minute)}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-4 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-gray-950 transition-all hover:bg-amber-400 active:scale-[0.98]"
          >
            {t.common.done}
          </button>
        </div>
      ) : null}
    </div>
  );
}
