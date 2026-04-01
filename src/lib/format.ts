import { CURRENCY_SYMBOLS } from "./constants";
import type { Translations } from "@/lib/i18n";

export function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  if (currency === "VND") {
    return `${amount.toLocaleString("vi-VN")}₫`;
  }
  return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateGroup(dateStr: string, dt?: Translations["dateTime"]): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayLabel = dt?.today ?? "Today";
  const yesterdayLabel = dt?.yesterday ?? "Yesterday";

  if (date.toDateString() === today.toDateString()) return todayLabel;
  if (date.toDateString() === yesterday.toDateString()) return yesterdayLabel;

  if (dt) {
    return `${dt.months[date.getMonth()]} ${date.getDate()}`;
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function getDateOnly(dateStr: string): string {
  const date = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getMonthKey(dateStr: string): string {
  const date = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/**
 * Returns a local datetime string in "YYYY-MM-DDTHH:mm" format
 * using the user's browser timezone (NOT UTC).
 */
export function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
}

/**
 * Parses a local datetime string ("YYYY-MM-DDTHH:mm") into a Date
 * interpreted in the user's local timezone.
 */
export function parseLocalDateTimeString(str: string): Date {
  const [datePart, timePart] = str.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [h, min] = (timePart ?? "00:00").split(":").map(Number);
  return new Date(y, m - 1, d, h, min);
}
