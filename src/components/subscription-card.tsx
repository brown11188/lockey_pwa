"use client";

import { useMemo } from "react";
import { useCurrency } from "@/lib/currency-context";
import { useLanguage } from "@/lib/language-context";
import { formatCurrency } from "@/lib/format";
import { getCategoryInfo } from "@/lib/constants";
import { findKnownService } from "@/lib/known-services";
import { Clock as ClockIcon, Pencil as PencilIcon, Trash2 as Trash2Icon } from "lucide-react";
import type { Subscription } from "@/db/schema";

interface SubscriptionCardProps {
  subscription: Subscription;
  daysUntilRenewal: number;
  onEdit: (sub: Subscription) => void;
  onDelete: (sub: Subscription) => void;
  highlighted?: boolean;
}

export function SubscriptionCard({
  subscription,
  daysUntilRenewal,
  onEdit,
  onDelete,
  highlighted = false,
}: SubscriptionCardProps) {
  const { currency } = useCurrency();
  const { t } = useLanguage();

  const logo = useMemo(() => {
    if (subscription.logoUrl) return subscription.logoUrl;
    const known = findKnownService(subscription.name);
    return known?.logo || "💳";
  }, [subscription.name, subscription.logoUrl]);

  const categoryLabel = useMemo(() => {
    if (!subscription.categoryId) return null;
    const info = getCategoryInfo(subscription.categoryId, t.categories);
    return `${info.emoji} ${info.label}`;
  }, [subscription.categoryId, t.categories]);

  const daysLabel = useMemo(() => {
    if (daysUntilRenewal === 0) return t.subscriptions.today;
    if (daysUntilRenewal === 1) return t.subscriptions.tomorrow;
    return t.subscriptions.daysLeft.replace("{days}", String(daysUntilRenewal));
  }, [daysUntilRenewal, t.subscriptions]);

  const renewalDate = new Date(subscription.nextRenewalDate + "T00:00:00");
  const dateLabel = renewalDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        highlighted
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-white/10 bg-white/5"
      } ${!subscription.isActive ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
          {logo}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white truncate">{subscription.name}</h3>
            <span className="shrink-0 text-sm font-bold text-amber-400">
              {formatCurrency(subscription.amount, currency)}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {categoryLabel && (
              <span className="text-xs text-gray-500">{categoryLabel}</span>
            )}
            <span className="text-xs text-gray-500">{dateLabel}</span>
            {highlighted && daysUntilRenewal <= 7 && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                <ClockIcon className="h-3 w-3" />
                {daysLabel}
              </span>
            )}
            {!subscription.isActive && (
              <span className="rounded-full bg-gray-500/20 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                {t.subscriptions.paused}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => onEdit(subscription)}
          className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <PencilIcon className="h-3 w-3" />
          {t.common.edit}
        </button>
        <button
          type="button"
          onClick={() => onDelete(subscription)}
          className="flex items-center gap-1 rounded-lg bg-red-500/5 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10"
        >
          <Trash2Icon className="h-3 w-3" />
          {t.common.delete}
        </button>
      </div>
    </div>
  );
}