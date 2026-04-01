"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X as XIcon, ChevronLeft, ChevronRight, Share2 as ShareIcon, Download as DownloadIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency } from "@/lib/format";
import { getCategoryInfo } from "@/lib/constants";

export interface WrappedData {
  hasData: boolean;
  dismissed: boolean;
  monthKey: string;
  year: number;
  month: number;
  totalSpending: number;
  entryCount: number;
  activeDays: number;
  topCategory: {
    category: string;
    total: number;
    count: number;
    pct: number;
  } | null;
  biggestDay: {
    date: string;
    total: number;
  } | null;
  comparison: {
    prevTotal: number;
    diff: number;
    pct: number;
    increased: boolean;
    topChangeCategory: string | null;
  };
  foodSpending: number;
}

interface MonthlyWrappedProps {
  data: WrappedData;
  onDismiss: () => void;
}

function CountUpNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = null;
    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

export function MonthlyWrapped({ data, onDismiss }: MonthlyWrappedProps) {
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [entering, setEntering] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number>(0);

  const TOTAL_SLIDES = 6;

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setEntering(true)));
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, TOTAL_SLIDES - 1));
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
  }, [nextSlide, prevSlide]);

  const handleShare = useCallback(async () => {
    const shareText = `${t.wrapped.monthOf.replace("{month}", t.dateTime.months[data.month - 1])} - ${formatCurrency(data.totalSpending, currency)} (${data.entryCount} expenses) #Lockey`;

    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
      } catch {
        // Fallback
      }
    }
  }, [data, currency, t]);

  const monthName = t.dateTime.months[data.month - 1] ?? `Month ${data.month}`;
  const topCatInfo = data.topCategory
    ? getCategoryInfo(data.topCategory.category, t.categories)
    : null;
  const changeCategory = data.comparison.topChangeCategory
    ? getCategoryInfo(data.comparison.topChangeCategory, t.categories)
    : null;

  // Gradient backgrounds for each slide
  const gradients = [
    "from-gray-950 via-indigo-950/30 to-gray-950",
    "from-gray-950 via-purple-950/30 to-gray-950",
    "from-gray-950 via-orange-950/30 to-gray-950",
    "from-gray-950 via-blue-950/30 to-gray-950",
    "from-gray-950 via-emerald-950/30 to-gray-950",
    "from-gray-950 via-amber-950/30 to-gray-950",
  ];

  const slides = [
    // Slide 1: Overview
    (
      <div key="s1" className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <p className="text-lg text-gray-400">{t.wrapped.monthOf.replace("{month}", monthName)}</p>
        <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-8 py-6">
          <p className="text-sm text-gray-400">{t.wrapped.totalSpending}</p>
          <p className="mt-2 text-4xl font-black text-amber-400">
            <CountUpNumber value={data.totalSpending} />
            <span className="text-xl">{currency === "VND" ? "₫" : "$"}</span>
          </p>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          {t.wrapped.onDays.replace("{days}", String(data.activeDays))}
          {"  \u2022  "}
          {t.wrapped.entries.replace("{count}", String(data.entryCount))}
        </p>
      </div>
    ),

    // Slide 2: Top Category
    (
      <div key="s2" className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <p className="text-lg text-gray-400">{t.wrapped.youBurnedMostOn}</p>
        {topCatInfo && data.topCategory && (
          <>
            <div className="mt-6 text-7xl animate-bounce">{topCatInfo.emoji}</div>
            <h3 className="mt-4 text-2xl font-bold text-white">{topCatInfo.label}</h3>
            <p className="mt-2 text-3xl font-black text-amber-400">
              <CountUpNumber value={data.topCategory.total} />
              <span className="text-lg">{currency === "VND" ? "₫" : "$"}</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {t.wrapped.ofTotal.replace("{pct}", String(data.topCategory.pct))}
            </p>
          </>
        )}
      </div>
    ),

    // Slide 3: Biggest Day
    (
      <div key="s3" className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <p className="text-lg text-gray-400">📅 {t.wrapped.dayYouSpentMost}</p>
        {data.biggestDay && (
          <>
            <h3 className="mt-4 text-xl font-bold text-white">
              {new Date(data.biggestDay.date + "T12:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h3>
            <p className="mt-3 text-4xl font-black text-amber-400">
              <CountUpNumber value={data.biggestDay.total} />
              <span className="text-xl">{currency === "VND" ? "₫" : "$"}</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">{t.wrapped.inOneDay}</p>
          </>
        )}
      </div>
    ),

    // Slide 4: Month comparison
    (
      <div key="s4" className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <p className="text-lg text-gray-400">{t.wrapped.vsLastMonth}</p>
        {data.comparison.prevTotal > 0 ? (
          <>
            <p className="mt-6 text-2xl font-bold text-white">
              {data.comparison.increased
                ? t.wrapped.increased
                    .replace("{pct}", String(data.comparison.pct))
                    .replace("{amount}", formatCurrency(Math.abs(data.comparison.diff), currency))
                : t.wrapped.decreased
                    .replace("{pct}", String(data.comparison.pct))
                    .replace("{amount}", formatCurrency(Math.abs(data.comparison.diff), currency))}
            </p>
            {changeCategory && (
              <p className="mt-3 text-sm text-gray-400">
                {t.wrapped.mainlyDueTo.replace("{category}", `${changeCategory.emoji} ${changeCategory.label}`)}
              </p>
            )}
          </>
        ) : (
          <p className="mt-6 text-lg text-gray-500">{t.wrapped.noDataHint}</p>
        )}
      </div>
    ),

    // Slide 5: Fun stat
    (
      <div key="s5" className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <p className="text-lg text-gray-400">{t.wrapped.funStat}</p>
        {data.foodSpending > 0 ? (
          <>
            <p className="mt-6 whitespace-pre-line text-base text-gray-300">
              {t.wrapped.ifYouDidntEatOut}
            </p>
            <p className="mt-4 text-4xl font-black text-amber-400">
              <CountUpNumber value={data.foodSpending} />
              <span className="text-xl">{currency === "VND" ? "₫" : "$"}</span>
            </p>
            <p className="mt-3 text-sm text-gray-400">
              {t.wrapped.equivalentTo}
            </p>
          </>
        ) : (
          <p className="mt-6 text-5xl">🌟</p>
        )}
      </div>
    ),

    // Slide 6: Share
    (
      <div key="s6" className="flex flex-1 flex-col items-center justify-center px-8 text-center" ref={shareCardRef}>
        <p className="text-lg text-gray-400">{t.wrapped.shareYourMonth}</p>
        <div className="mt-6 w-full rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs text-gray-500">Lockey \u2022 {monthName} {data.year}</p>
          <p className="mt-3 text-3xl font-black text-amber-400">
            {formatCurrency(data.totalSpending, currency)}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {data.entryCount} expenses \u2022 {data.activeDays} days
          </p>
          {topCatInfo && (
            <p className="mt-2 text-sm text-gray-500">
              Top: {topCatInfo.emoji} {topCatInfo.label}
            </p>
          )}
        </div>
        <div className="mt-6 flex gap-3 w-full">
          <button
            type="button"
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 font-bold text-gray-950 hover:bg-amber-400"
          >
            <ShareIcon className="h-4 w-4" />
            {t.wrapped.shareButton}
          </button>
        </div>
      </div>
    ),
  ];

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex flex-col transition-all duration-500",
        entering ? "opacity-100" : "opacity-0"
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Animated gradient background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-b transition-all duration-700",
        gradients[currentSlide]
      )} />

      {/* Close button */}
      <div className="relative z-10 flex items-center justify-between p-4">
        <span className="text-xs text-gray-500">
          {t.wrapped.slide.replace("{n}", String(currentSlide + 1)).replace("{total}", String(TOTAL_SLIDES))}
        </span>
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Slide indicator dots */}
      <div className="relative z-10 flex justify-center gap-1.5 px-4">
        {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              i === currentSlide ? "w-6 bg-amber-400" : "w-1.5 bg-white/20"
            )}
          />
        ))}
      </div>

      {/* Slide content */}
      <div className="relative z-10 flex flex-1 flex-col">
        {slides[currentSlide]}
      </div>

      {/* Navigation */}
      <div className="relative z-10 flex items-center justify-between px-6 pb-8">
        <button
          type="button"
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-400 disabled:opacity-20"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {currentSlide < TOTAL_SLIDES - 1 ? (
          <button
            type="button"
            onClick={nextSlide}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-gray-400"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-xl bg-white/5 px-4 py-2 text-sm text-gray-400 hover:bg-white/10"
          >
            {t.wrapped.dismiss}
          </button>
        )}
      </div>
    </div>
  );
}
