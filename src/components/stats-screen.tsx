"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { getEntryPhotoUrl } from "@/lib/entry-photo";
import { useCurrency } from "@/lib/currency-context";
import { useLanguage } from "@/lib/language-context";
import { formatCurrency, formatTime } from "@/lib/format";
import { getCategoryInfo } from "@/lib/constants";
import { SummaryCard } from "@/components/summary-card";
import { CategoryBadge } from "@/components/category-badge";
import { BudgetSection } from "@/components/budget-section";
import { GoalsScreen } from "@/components/goals-screen";
import { MonthlyWrapped, type WrappedData } from "@/components/monthly-wrapped";
import Link from "next/link";
import { Wallet as WalletIcon, Calendar as CalendarIcon, Trophy as TrophyIcon, Settings as SettingsIcon } from "lucide-react";
import type { StatsData } from "@/lib/compute-stats";

const CHART_COLORS = [
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#6b7280",
];

interface StatsScreenProps {
  initialStats?: StatsData;
}

export function StatsScreen({ initialStats }: StatsScreenProps) {
  const { currency } = useCurrency();
  const { t } = useLanguage();
  const [view, setView] = useState<"week" | "month">("week");
  const [stats, setStats] = useState<StatsData | null>(initialStats ?? null);
  const [loading, setLoading] = useState(!initialStats);
  const [wrappedData, setWrappedData] = useState<WrappedData | null>(null);
  const [showWrapped, setShowWrapped] = useState(false);
  // Skip the first "week" fetch when server already provided data
  const skipInitialFetch = useRef(!!initialStats);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/stats?view=${view}`);
      const data = await res.json();
      setStats(data);
    } catch {
      console.error("Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    fetchStats();
  }, [fetchStats]);

  // Fetch wrapped data for "View Recap" button
  useEffect(() => {
    // Get current month wrapped data
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthKey = `${year}-${month.toString().padStart(2, "0")}`;
    apiFetch(`/api/wrapped?month=${monthKey}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data?.hasData) setWrappedData(data); })
      .catch(() => {});
  }, []);

  const maxDaily = stats
    ? Math.max(...stats.dailySpending.map((d) => d.total), 1)
    : 1;

  const totalCategory = stats
    ? stats.categoryBreakdown.reduce((sum, c) => sum + c.total, 0)
    : 0;

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/5 bg-gray-950/95 backdrop-blur-lg safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-white">{t.stats.title}</h1>
          <Link
            href="/settings"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white"
          >
            <SettingsIcon className="h-4 w-4" />
          </Link>
        </div>

        {/* Toggle */}
        <div className="flex gap-2 px-4 pb-3">
          {(["week", "month"] as const).map((v) => {
            const viewLabels = { week: t.stats.weekly, month: t.stats.monthly };
            return (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  view === v
                    ? "bg-amber-500 text-gray-950"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                {viewLabels[v]}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
        </div>
      ) : stats ? (
        <div className="px-4 pt-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              title={t.stats.thisWeek}
              value={formatCurrency(stats.weekTotal, currency)}
              icon={<CalendarIcon className="h-4 w-4" />}
            />
            <SummaryCard
              title={t.stats.thisMonth}
              value={formatCurrency(stats.monthTotal, currency)}
              icon={<WalletIcon className="h-4 w-4" />}
            />
          </div>
          {stats.topCategory && (
            <div className="mt-3">
              <SummaryCard
                title={t.stats.topCategory}
                value={`${getCategoryInfo(stats.topCategory, t.categories).emoji} ${getCategoryInfo(stats.topCategory, t.categories).label}`}
                subtitle={formatCurrency(stats.topCategoryTotal, currency)}
                icon={<TrophyIcon className="h-4 w-4" />}
              />
            </div>
          )}

          {/* Budget Section */}
          <BudgetSection />

          {/* Saving Goals */}
          <GoalsScreen />

          {/* View Recap Button */}
          {wrappedData && wrappedData.hasData && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowWrapped(true)}
                className="w-full rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-purple-500/5 p-4 text-center transition-all hover:border-amber-500/40"
              >
                <span className="text-2xl">🎉</span>
                <p className="mt-1 font-semibold text-white">{t.wrapped.viewRecap}</p>
              </button>
            </div>
          )}

          {/* Bar Chart - Daily Spending */}
          <div className="mt-6">
            <h2 className="mb-3 text-sm font-semibold text-gray-400">
              {t.stats.dailySpending}
            </h2>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-end gap-1" style={{ height: "160px" }}>
                {stats.dailySpending.map((day) => {
                  const height =
                    day.total > 0 ? (day.total / maxDaily) * 100 : 0;
                  return (
                    <div
                      key={day.date}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <div
                        className="w-full rounded-t-md bg-amber-500 transition-all"
                        style={{
                          height: `${Math.max(height, 2)}%`,
                          opacity: day.total > 0 ? 1 : 0.2,
                        }}
                      />
                      <span className="text-[10px] text-gray-500">
                        {day.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Donut Chart - Category Breakdown */}
          {stats.categoryBreakdown.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 text-sm font-semibold text-gray-400">
                {t.stats.byCategory}
              </h2>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                {/* Simple horizontal bars */}
                <div className="space-y-3">
                  {stats.categoryBreakdown.map((cat, i) => {
                    const pct =
                      totalCategory > 0
                        ? (cat.total / totalCategory) * 100
                        : 0;
                    return (
                      <div key={cat.category}>
                        <div className="mb-1 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CategoryBadge category={cat.category} />
                            <span className="text-xs text-gray-500">
                              {cat.count} {t.stats.entries}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-white">
                            {formatCurrency(cat.total, currency)}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor:
                                CHART_COLORS[i % CHART_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          {stats.recentTransactions.length > 0 && (
            <div className="mt-6 mb-4">
              <h2 className="mb-3 text-sm font-semibold text-gray-400">
                {t.stats.recentTransactions}
              </h2>
              <div className="space-y-2">
                {stats.recentTransactions.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3"
                  >
                    {getEntryPhotoUrl(entry) ? (
                      <img
                        src={getEntryPhotoUrl(entry) ?? undefined}
                        alt=""
                        className="h-12 w-12 rounded-lg object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-900 text-[10px] text-gray-500">
                        N/A
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-400">
                          {formatCurrency(entry.amount, currency)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(entry.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <CategoryBadge category={entry.category} />
                        {entry.note && (
                          <span className="truncate text-xs text-gray-500">
                            {entry.note}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Monthly Wrapped Modal */}
      {showWrapped && wrappedData && wrappedData.hasData && (
        <MonthlyWrapped
          data={wrappedData}
          onDismiss={() => setShowWrapped(false)}
        />
      )}
    </div>
  );
}
