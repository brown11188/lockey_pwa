"use client";

import { useCallback, useState } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { CATEGORIES } from "@/lib/constants";

export interface FilterState {
  categories: string[];
  minAmount: string;
  maxAmount: string;
  dateFrom: string;
  dateTo: string;
}

export const EMPTY_FILTERS: FilterState = {
  categories: [],
  minAmount: "",
  maxAmount: "",
  dateFrom: "",
  dateTo: "",
};

export function countActiveFilters(f: FilterState): number {
  let n = 0;
  if (f.categories.length > 0) n++;
  if (f.minAmount || f.maxAmount) n++;
  if (f.dateFrom || f.dateTo) n++;
  return n;
}

interface FilterPanelProps {
  open: boolean;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onClose: () => void;
}

export function FilterPanel({ open, filters, onApply, onClose }: FilterPanelProps) {
  const { t } = useLanguage();
  const [local, setLocal] = useState<FilterState>(filters);

  const toggleCategory = useCallback((cat: string) => {
    setLocal((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  }, []);

  const handleApply = useCallback(() => {
    onApply(local);
    onClose();
  }, [local, onApply, onClose]);

  const handleClear = useCallback(() => {
    const empty = { ...EMPTY_FILTERS };
    setLocal(empty);
    onApply(empty);
    onClose();
  }, [onApply, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg animate-slide-up rounded-t-2xl border-t border-white/10 bg-gray-900 px-4 pb-8 pt-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{t.search.filterTitle}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Categories */}
        <section className="mb-5">
          <h4 className="mb-2 text-sm font-medium text-gray-400">{t.search.categories}</h4>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = local.categories.includes(cat.value);
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => toggleCategory(cat.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "bg-amber-500 text-gray-950"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {cat.emoji} {t.categories[cat.labelKey]}
                </button>
              );
            })}
          </div>
        </section>

        {/* Amount range */}
        <section className="mb-5">
          <h4 className="mb-2 text-sm font-medium text-gray-400">{t.search.amountRange}</h4>
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="numeric"
              value={local.minAmount}
              onChange={(e) => setLocal((p) => ({ ...p, minAmount: e.target.value }))}
              placeholder={t.search.minAmount}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-amber-500/50"
            />
            <span className="text-gray-500">–</span>
            <input
              type="number"
              inputMode="numeric"
              value={local.maxAmount}
              onChange={(e) => setLocal((p) => ({ ...p, maxAmount: e.target.value }))}
              placeholder={t.search.maxAmount}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-amber-500/50"
            />
          </div>
        </section>

        {/* Date range */}
        <section className="mb-6">
          <h4 className="mb-2 text-sm font-medium text-gray-400">{t.search.dateRange}</h4>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">{t.search.from}</label>
              <input
                type="date"
                value={local.dateFrom}
                onChange={(e) => setLocal((p) => ({ ...p, dateFrom: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50 [color-scheme:dark]"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">{t.search.to}</label>
              <input
                type="date"
                value={local.dateTo}
                onChange={(e) => setLocal((p) => ({ ...p, dateTo: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50 [color-scheme:dark]"
              />
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10"
          >
            {t.search.clear}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-gray-950 hover:bg-amber-400"
          >
            {t.search.apply}
          </button>
        </div>
      </div>
    </div>
  );
}
