"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useCurrency } from "@/lib/currency-context";
import { useLanguage } from "@/lib/language-context";
import { SubscriptionCard } from "@/components/subscription-card";
import { SubscriptionFormModal, type SubscriptionFormData } from "@/components/subscription-form-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Toast, triggerHaptic } from "@/components/toast";
import {
  Settings as SettingsIcon,
  Plus as PlusIcon,
  CreditCard as CreditCardIcon,
  Calendar as CalendarIcon,
} from "lucide-react";
import { SubscriptionOverview } from "@/components/subscription-overview";
import type { Subscription } from "@/db/schema";

function getDaysUntilRenewal(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewal = new Date(dateStr + "T00:00:00");
  renewal.setHours(0, 0, 0, 0);
  return Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}


export function SubscriptionsScreen() {
  const { currency } = useCurrency();
  const { t } = useLanguage();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editSub, setEditSub] = useState<Subscription | null>(null);
  const [deleteSub, setDeleteSub] = useState<Subscription | null>(null);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" as "success" | "error" });

  const fetchSubs = useCallback(async () => {
    try {
      const res = await apiFetch("/api/subscriptions");
      if (res.ok) setSubs(await res.json());
    } catch {
      console.error("Failed to fetch subscriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubs();
  }, [fetchSubs]);

  const upcomingSubs = useMemo(
    () =>
      subs
        .filter((s) => s.isActive && getDaysUntilRenewal(s.nextRenewalDate) >= 0 && getDaysUntilRenewal(s.nextRenewalDate) <= 7)
        .sort((a, b) => getDaysUntilRenewal(a.nextRenewalDate) - getDaysUntilRenewal(b.nextRenewalDate)),
    [subs]
  );

  const groupedSubs = useMemo(() => {
    const groups: Record<string, Subscription[]> = { monthly: [], yearly: [], weekly: [] };
    for (const s of subs) {
      const key = s.cycle === "weekly" ? "weekly" : s.cycle === "yearly" ? "yearly" : "monthly";
      groups[key].push(s);
    }
    return groups;
  }, [subs]);

  const handleSave = useCallback(async (data: SubscriptionFormData) => {
    try {
      if (editSub) {
        await apiFetch(`/api/subscriptions/${editSub.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        await apiFetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }
      triggerHaptic();
      setFormOpen(false);
      setEditSub(null);
      setToast({ visible: true, message: t.subscriptions.saved, type: "success" });
      fetchSubs();
    } catch {
      setToast({ visible: true, message: "Failed to save", type: "error" });
    }
  }, [editSub, fetchSubs, t.subscriptions.saved]);

  const handleDelete = useCallback(async () => {
    if (!deleteSub) return;
    try {
      await apiFetch(`/api/subscriptions/${deleteSub.id}`, { method: "DELETE" });
      triggerHaptic();
      setSubs((prev) => prev.filter((s) => s.id !== deleteSub.id));
      setDeleteSub(null);
      setToast({ visible: true, message: t.subscriptions.deleted, type: "success" });
    } catch {
      setToast({ visible: true, message: "Failed to delete", type: "error" });
    }
  }, [deleteSub, t.subscriptions.deleted]);

  const handleEdit = useCallback((sub: Subscription) => {
    setEditSub(sub);
    setFormOpen(true);
  }, []);

  const handleAdd = useCallback(() => {
    setEditSub(null);
    setFormOpen(true);
  }, []);

  const cycleLabels: Record<string, string> = {
    weekly: t.subscriptions.weekly,
    monthly: t.subscriptions.monthly,
    yearly: t.subscriptions.yearly,
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/5 bg-gray-950/95 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-white">{t.subscriptions.title}</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAdd}
              className="flex h-9 items-center gap-1.5 rounded-full bg-amber-500 px-3 text-sm font-bold text-gray-950 transition-all hover:bg-amber-400"
            >
              <PlusIcon className="h-4 w-4" />
              {t.common.add}
            </button>
            <Link
              href="/settings"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white"
            >
              <SettingsIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
        </div>
      ) : subs.length === 0 ? (
        /* Empty state */
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3 px-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
            <CreditCardIcon className="h-10 w-10 text-gray-600" />
          </div>
          <p className="text-lg font-medium text-gray-400">{t.subscriptions.emptyTitle}</p>
          <p className="text-sm text-gray-600">{t.subscriptions.emptyDesc}</p>
          <button
            type="button"
            onClick={handleAdd}
            className="mt-4 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-gray-950 transition-all hover:bg-amber-400"
          >
            {t.subscriptions.emptyButton}
          </button>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-6">
          {/* Overview charts */}
          <SubscriptionOverview subscriptions={subs} currency={currency} />

          {/* Upcoming renewals */}
          {upcomingSubs.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-400">
                <CalendarIcon className="h-4 w-4" />
                {t.subscriptions.upcomingRenewals}
              </h2>
              <div className="space-y-3">
                {upcomingSubs.map((sub) => (
                  <SubscriptionCard
                    key={sub.id}
                    subscription={sub}
                    daysUntilRenewal={getDaysUntilRenewal(sub.nextRenewalDate)}
                    onEdit={handleEdit}
                    onDelete={setDeleteSub}
                    highlighted
                  />
                ))}
              </div>
            </section>
          )}

          {/* All subscriptions grouped by cycle */}
          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-400">
              {t.subscriptions.allSubscriptions}
            </h2>
            {(["monthly", "yearly", "weekly"] as const).map((cycle) => {
              const group = groupedSubs[cycle];
              if (!group || group.length === 0) return null;
              return (
                <div key={cycle} className="mb-4">
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-600">
                    {cycleLabels[cycle]}
                  </h3>
                  <div className="space-y-3">
                    {group.map((sub) => (
                      <SubscriptionCard
                        key={sub.id}
                        subscription={sub}
                        daysUntilRenewal={getDaysUntilRenewal(sub.nextRenewalDate)}
                        onEdit={handleEdit}
                        onDelete={setDeleteSub}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      )}

      {/* Form modal */}
      <SubscriptionFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditSub(null); }}
        onSave={handleSave}
        initial={editSub}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteSub}
        title={t.subscriptions.deleteTitle}
        description={t.subscriptions.deleteDesc}
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        onConfirm={handleDelete}
        onCancel={() => setDeleteSub(null)}
        destructive
      />

      {/* Toast */}
      <Toast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
        onHide={() => setToast((p) => ({ ...p, visible: false }))}
      />
    </div>
  );
}