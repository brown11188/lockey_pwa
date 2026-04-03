"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useLanguage } from "@/lib/language-context";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency } from "@/lib/format";
import { CATEGORIES, getCategoryInfo } from "@/lib/constants";
import { searchKnownServices, findKnownService, type KnownService } from "@/lib/known-services";
import { X as XIcon } from "lucide-react";
import type { Subscription } from "@/db/schema";

type Cycle = "weekly" | "monthly" | "yearly";

interface SubscriptionFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: SubscriptionFormData) => void;
  initial?: Subscription | null;
}

export interface SubscriptionFormData {
  name: string;
  logoUrl: string | null;
  amount: string;
  currency: string;
  cycle: Cycle;
  nextRenewalDate: string;
  categoryId: string;
  note: string;
  reminderDaysBefore: number;
  isActive: boolean;
  isShared: boolean;
}

export function SubscriptionFormModal({ open, onClose, onSave, initial }: SubscriptionFormModalProps) {
  const { t } = useLanguage();
  const { currency: defaultCurrency } = useCurrency();

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"VND" | "USD">((defaultCurrency as "VND" | "USD") ?? "VND");
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [nextRenewalDate, setNextRenewalDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [reminderDaysBefore, setReminderDaysBefore] = useState(3);
  const [isActive, setIsActive] = useState(true);
  const [isShared, setIsShared] = useState(false);
  const [suggestions, setSuggestions] = useState<KnownService[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (open) {
      if (initial) {
        setName(initial.name);
        setLogoUrl(initial.logoUrl);
        setAmount(String(initial.amount));
        setCurrency((initial.currency as "VND" | "USD") || (defaultCurrency as "VND" | "USD"));
        setCycle(initial.cycle as Cycle);
        setNextRenewalDate(initial.nextRenewalDate);
        setCategoryId(initial.categoryId || "");
        setNote(initial.note || "");
        setReminderDaysBefore(initial.reminderDaysBefore);
        setIsActive(initial.isActive);
        setIsShared(initial.isShared ?? false);
      } else {
        setName("");
        setLogoUrl(null);
        setAmount("");
        setCurrency((defaultCurrency as "VND" | "USD") ?? "VND");
        setCycle("monthly");
        setNextRenewalDate("");
        setCategoryId("");
        setNote("");
        setReminderDaysBefore(3);
        setIsActive(true);
        setIsShared(false);
      }
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [open, initial]);

  const handleNameChange = useCallback((val: string) => {
    setName(val);
    const matches = searchKnownServices(val);
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
    const exact = findKnownService(val);
    if (exact) {
      setLogoUrl(exact.logo);
    }
  }, []);

  const selectSuggestion = useCallback((s: KnownService) => {
    setName(s.name);
    setLogoUrl(s.logo);
    if (!categoryId) setCategoryId(s.defaultCategory);
    if (cycle === "monthly" && s.defaultCycle !== "monthly") setCycle(s.defaultCycle);
    setShowSuggestions(false);
  }, [categoryId, cycle]);

  const handleSubmit = useCallback(() => {
    if (!name.trim() || !amount || !nextRenewalDate) return;
    onSave({
      name: name.trim(),
      logoUrl,
      amount,
      currency,
      cycle,
      nextRenewalDate,
      categoryId: categoryId || null as unknown as string,
      note,
      reminderDaysBefore,
      isActive,
      isShared,
    });
  }, [name, logoUrl, amount, currency, cycle, nextRenewalDate, categoryId, note, reminderDaysBefore, isActive, onSave]);

  const matchedLogo = useMemo(() => {
    if (logoUrl) return logoUrl;
    const found = findKnownService(name);
    return found?.logo || null;
  }, [logoUrl, name]);

  if (!open) return null;

  const isEdit = !!initial;
  const canSave = name.trim().length > 0 && parseFloat(amount) > 0 && nextRenewalDate;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl bg-gray-900 pb-8">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-gray-900 px-5 pb-2 pt-5">
          <h2 className="text-lg font-bold text-white">
            {isEdit ? t.subscriptions.editSubscription : t.subscriptions.addNew}
          </h2>
          <button type="button" onClick={onClose} className="rounded-full bg-white/5 p-2 text-gray-400 hover:text-white">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 pt-2">
          {/* Service name + logo */}
          <div className="relative">
            <label className="mb-1.5 block text-sm font-medium text-gray-400">{t.subscriptions.serviceName}</label>
            <div className="flex items-center gap-3">
              {matchedLogo && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl overflow-hidden">
                  {matchedLogo.startsWith("http") ? (
                    <img
                      src={matchedLogo}
                      alt={name}
                      className="h-7 w-7 object-contain"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    matchedLogo
                  )}
                </div>
              )}
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder={t.subscriptions.serviceNamePlaceholder}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-600 focus:border-amber-500/50 focus:outline-none"
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-white/10 bg-gray-800 py-1 shadow-2xl">
                {suggestions.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => selectSuggestion(s)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white hover:bg-white/5"
                  >
                    <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-md bg-white/10">
                      {s.logo.startsWith("http") ? (
                        <img src={s.logo} alt={s.name} className="h-5 w-5 object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      ) : (
                        <span className="text-sm">{s.logo}</span>
                      )}
                    </span>
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Amount + Currency toggle */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-400">{t.subscriptions.amount}</label>
              <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5 gap-0.5">
                {(["VND", "USD"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrency(c)}
                    className={`rounded-md px-3 py-1 text-xs font-bold transition-all ${
                      currency === c
                        ? "bg-amber-500 text-gray-950 shadow-sm"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-500">
                {currency === "VND" ? "₫" : "$"}
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-xl font-bold text-amber-400 placeholder:text-gray-600 focus:border-amber-500/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Cycle */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-400">{t.subscriptions.cycle}</label>
            <div className="flex gap-2">
              {(["weekly", "monthly", "yearly"] as Cycle[]).map((c) => {
                const labels: Record<Cycle, string> = {
                  weekly: t.subscriptions.weekly,
                  monthly: t.subscriptions.monthly,
                  yearly: t.subscriptions.yearly,
                };
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCycle(c)}
                    className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                      cycle === c
                        ? "border-amber-500 bg-amber-500/20 text-amber-300"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    {labels[c]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Next renewal date */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-400">{t.subscriptions.nextRenewal}</label>
            <input
              type="date"
              value={nextRenewalDate}
              onChange={(e) => setNextRenewalDate(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-500/50 focus:outline-none [color-scheme:dark]"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-400">{t.subscriptions.category}</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.slice(0, 8).map((cat) => {
                const info = getCategoryInfo(cat.value, t.categories);
                const selected = categoryId === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategoryId(selected ? "" : cat.value)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      selected
                        ? "border-amber-500 bg-amber-500/20 text-amber-300"
                        : "border-white/10 bg-white/5 text-gray-400"
                    }`}
                  >
                    {info.emoji} {info.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-400">{t.subscriptions.note}</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.subscriptions.notePlaceholder}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-600 focus:border-amber-500/50 focus:outline-none"
            />
          </div>

          {/* Reminder */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-400">{t.subscriptions.reminderBefore}</label>
            <div className="flex gap-2">
              {[1, 3, 7].map((days) => {
                const labels: Record<number, string> = {
                  1: t.subscriptions.reminderDays1,
                  3: t.subscriptions.reminderDays3,
                  7: t.subscriptions.reminderDays7,
                };
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setReminderDaysBefore(days)}
                    className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                      reminderDaysBefore === days
                        ? "border-amber-500 bg-amber-500/20 text-amber-300"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                    }`}
                  >
                    {labels[days]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status toggle */}
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="text-sm font-medium text-gray-300">{t.subscriptions.status}</span>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                isActive
                  ? "bg-green-500/20 text-green-400"
                  : "bg-gray-500/20 text-gray-500"
              }`}
            >
              {isActive ? t.subscriptions.active : t.subscriptions.paused}
            </button>
          </div>

          {/* Share with family toggle */}
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <span className="text-sm font-medium text-gray-300">Share with family</span>
              <p className="text-xs text-gray-600">Visible to all family members</p>
            </div>
            <button
              type="button"
              onClick={() => setIsShared(!isShared)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                isShared
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-gray-500/20 text-gray-500"
              }`}
            >
              {isShared ? "Shared" : "Private"}
            </button>
          </div>

          {/* Save / Cancel */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-gray-300 transition-all hover:bg-white/10"
            >
              {t.common.cancel}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSave}
              className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-bold text-gray-950 transition-all hover:bg-amber-400 disabled:opacity-40"
            >
              {t.common.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}