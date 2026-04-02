"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Loader as LoaderIcon, Check as CheckIcon, Sparkles as SparklesIcon } from "lucide-react";
import { BottomSheet } from "@/components/bottom-sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Toast, triggerHaptic } from "@/components/toast";
import { DateTimePicker } from "@/components/datetime-picker";
import { MilestoneModal } from "@/components/milestone-modal";
import { useCurrency } from "@/lib/currency-context";
import { useLanguage } from "@/lib/language-context";
import { apiFetch } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/http";
import { toLocalDateTimeString, parseLocalDateTimeString } from "@/lib/format";
import { useBudgetAlert } from "@/hooks/use-budget-alert";
import { useOcr } from "@/hooks/use-ocr";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";

// Per-category accent colors
const CAT_COLORS: Record<string, { pill: string; ring: string; glow: string }> = {
  food:          { pill: "bg-orange-500/20 text-orange-300 border-orange-500/40",  ring: "ring-orange-400/60",  glow: "shadow-orange-500/20" },
  transport:     { pill: "bg-blue-500/20 text-blue-300 border-blue-500/40",        ring: "ring-blue-400/60",    glow: "shadow-blue-500/20" },
  shopping:      { pill: "bg-pink-500/20 text-pink-300 border-pink-500/40",        ring: "ring-pink-400/60",    glow: "shadow-pink-500/20" },
  health:        { pill: "bg-green-500/20 text-green-300 border-green-500/40",     ring: "ring-green-400/60",   glow: "shadow-green-500/20" },
  housing:       { pill: "bg-purple-500/20 text-purple-300 border-purple-500/40",  ring: "ring-purple-400/60",  glow: "shadow-purple-500/20" },
  entertainment: { pill: "bg-red-500/20 text-red-300 border-red-500/40",           ring: "ring-red-400/60",     glow: "shadow-red-500/20" },
  education:     { pill: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",  ring: "ring-indigo-400/60",  glow: "shadow-indigo-500/20" },
  travel:        { pill: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",        ring: "ring-cyan-400/60",    glow: "shadow-cyan-500/20" },
  work:          { pill: "bg-slate-500/20 text-slate-300 border-slate-500/40",     ring: "ring-slate-400/60",   glow: "shadow-slate-500/20" },
  gifts:         { pill: "bg-rose-500/20 text-rose-300 border-rose-500/40",        ring: "ring-rose-400/60",    glow: "shadow-rose-500/20" },
  bills:         { pill: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",  ring: "ring-yellow-400/60",  glow: "shadow-yellow-500/20" },
  pets:          { pill: "bg-amber-500/20 text-amber-300 border-amber-500/40",     ring: "ring-amber-400/60",   glow: "shadow-amber-500/20" },
  other:         { pill: "bg-gray-500/20 text-gray-300 border-gray-500/40",        ring: "ring-gray-400/60",    glow: "shadow-gray-500/20" },
};

interface ExpenseBottomSheetProps {
  open: boolean;
  onClose: () => void;
  photoBlob: Blob;
  photoPreview: string;
  initialDateTime?: string;
  onSaved: () => void;
}

export function ExpenseBottomSheet({
  open,
  onClose,
  photoBlob,
  photoPreview,
  initialDateTime,
  onSaved,
}: ExpenseBottomSheetProps) {
  const { currency } = useCurrency();
  const { t } = useLanguage();
  const { checkBudget } = useBudgetAlert();
  const { scanning, scanReceipt } = useOcr();
  const amountRef = useRef<HTMLInputElement>(null);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [note, setNote] = useState("");
  const [dateTime, setDateTime] = useState(initialDateTime || toLocalDateTimeString(new Date()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [budgetAlert, setBudgetAlert] = useState<{ show: boolean; title: string; desc: string }>({ show: false, title: "", desc: "" });
  const [budgetWarningToast, setBudgetWarningToast] = useState({ visible: false, message: "" });
  const [milestone, setMilestone] = useState<{ key: "three" | "seven" | "fourteen" | "thirty" | "sixty" | "hundred"; emoji: string; days: number } | null>(null);
  const [subscriptionToast, setSubscriptionToast] = useState({ visible: false, name: "" });

  // Auto-focus amount input when sheet opens
  useEffect(() => {
    if (open) {
      setTimeout(() => amountRef.current?.focus(), 350);
      // Run OCR scan on the photo
      scanReceipt(photoBlob).then((result) => {
        if (result?.amount && !amount) {
          const formatted = result.amount.toLocaleString("en-US");
          setAmount(formatted);
          setAutoFilled(true);
        }
        if (result?.detectedSubscription) {
          setSubscriptionToast({ visible: true, name: result.detectedSubscription });
        }
      }).catch(() => {});
    }
  }, [open]);

  const formatAmountInput = useCallback((val: string) => {
    const raw = val.replace(/[^0-9.]/g, "");
    if (!raw) { setAmount(""); setAutoFilled(false); return; }
    const parts = raw.split(".");
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    setAmount(parts.length > 1 ? `${intPart}.${parts[1]}` : intPart);
    setAutoFilled(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!amount) { setError(t.capture.fillAmount); return; }
    setSaving(true);
    setError("");

    try {
      // Upload photo
      const formData = new FormData();
      formData.append("photo", photoBlob, "photo.jpg");
      const uploadRes = await apiFetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error(await getApiErrorMessage(uploadRes, t.capture.failedSave));
      const { photoId, uri } = (await uploadRes.json()) as { photoId?: string; uri?: string };
      if (!photoId || !uri) throw new Error(t.capture.failedSave);

      // Create entry
      const entryRes = await apiFetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoId,
          photoUri: uri,
          amount: parseFloat(amount.replace(/,/g, "")),
          currency,
          category,
          note,
          createdAt: dateTime ? parseLocalDateTimeString(dateTime).toISOString() : new Date().toISOString(),
        }),
      });
      if (!entryRes.ok) throw new Error(await getApiErrorMessage(entryRes, t.capture.failedSave));

      triggerHaptic();
      setToastVisible(true);

      // Update streak
      try {
        const streakRes = await apiFetch("/api/streak", { method: "POST" });
        if (streakRes.ok) {
          const streakData = await streakRes.json();
          if (streakData.milestone) {
            setMilestone(streakData.milestone);
          }
        }
      } catch {}

      // Check budget after save
      const budgetResult = await checkBudget(category);
      if (budgetResult.hasBudget && budgetResult.exceeded) {
        setBudgetAlert({
          show: true,
          title: t.budget.alertExceededTitle,
          desc: t.budget.alertExceededDesc.replace("{category}", category),
        });
      } else if (budgetResult.hasBudget && budgetResult.warning) {
        setBudgetWarningToast({
          visible: true,
          message: t.budget.alertNear.replace("{category}", category).replace("{pct}", String(budgetResult.pct)),
        });
      }

      setTimeout(() => {
        onSaved();
        resetForm();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t.capture.failedSave);
    } finally {
      setSaving(false);
    }
  }, [amount, photoBlob, currency, category, note, dateTime, t, onSaved, checkBudget]);

  const resetForm = useCallback(() => {
    setAmount("");
    setCategory("food");
    setNote("");
    setDateTime(toLocalDateTimeString(new Date()));
    setError("");
    setToastVisible(false);
    setAutoFilled(false);
    setMilestone(null);
  }, []);

  const handleRequestClose = useCallback(() => {
    if (amount || note) {
      setShowConfirmClose(true);
    } else {
      resetForm();
      onClose();
    }
  }, [amount, note, onClose, resetForm]);

  const handleConfirmDiscard = useCallback(() => {
    setShowConfirmClose(false);
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        confirmClose={true}
        onRequestClose={handleRequestClose}
      >
        <div className="px-4 pb-6 pt-2">
          {/* ── Hero: photo + amount ─────────────────────────── */}
          <div className="flex flex-col items-center pb-5 pt-1">
            {/* Photo with category-colored ring */}
            <div className={cn(
              "relative mb-4 h-20 w-20 overflow-hidden rounded-2xl ring-2 ring-offset-2 ring-offset-gray-900 shadow-xl transition-all duration-300",
              (CAT_COLORS[category] ?? CAT_COLORS.other).ring,
              (CAT_COLORS[category] ?? CAT_COLORS.other).glow,
            )}>
              <img src={photoPreview} alt="Captured" className="h-full w-full object-cover" />
              {scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60">
                  <LoaderIcon className="h-5 w-5 animate-spin text-amber-400" />
                  <span className="text-[9px] font-semibold text-amber-400">SCANNING</span>
                </div>
              )}
            </div>

            {/* Big amount input */}
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "text-2xl font-black transition-colors duration-300",
                amount ? "text-white/40" : "text-white/20"
              )}>
                {currency === "VND" ? "₫" : "$"}
              </span>
              <input
                ref={amountRef}
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => formatAmountInput(e.target.value)}
                placeholder={currency === "VND" ? "0" : "0.00"}
                className={cn(
                  "w-52 bg-transparent text-center text-5xl font-black tracking-tight placeholder:text-white/15 focus:outline-none transition-all duration-200",
                  scanning ? "animate-pulse text-amber-400/40" : amount ? "text-white" : "text-white/20"
                )}
              />
            </div>

            {/* Sub-label */}
            <p className="mt-1.5 text-xs font-medium text-gray-600">
              {scanning
                ? <span className="flex items-center gap-1 text-amber-400/70"><LoaderIcon className="h-3 w-3 animate-spin" />{t.ocr.scanning}</span>
                : autoFilled
                  ? <span className="flex items-center gap-1 text-amber-400/80"><SparklesIcon className="h-3 w-3" />{t.ocr.autoFilled}</span>
                  : "tap amount to edit"}
            </p>
          </div>

          {/* ── Category chips ───────────────────────────────── */}
          <div className="-mx-4 px-4">
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-600">
              {t.capture.category}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">
              {CATEGORIES.map((cat) => {
                const selected = category === cat.value;
                const colors = CAT_COLORS[cat.value] ?? CAT_COLORS.other;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={cn(
                      "flex shrink-0 flex-col items-center gap-1 rounded-2xl border px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition-all duration-200",
                      selected
                        ? cn(colors.pill, "scale-105 shadow-lg")
                        : "border-white/5 bg-white/5 text-gray-600 hover:border-white/10 hover:text-gray-400"
                    )}
                  >
                    <span className="text-lg leading-none">{cat.emoji}</span>
                    <span>{t.categories[cat.labelKey]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Note ────────────────────────────────────────── */}
          <div className="relative mt-4">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base select-none">✍️</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.capture.notePlaceholder}
              className="w-full rounded-2xl border border-white/8 bg-white/5 py-3 pl-9 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-white/20 focus:outline-none focus:ring-0 transition-colors"
            />
          </div>

          {/* ── Date / Time ──────────────────────────────────── */}
          <div className="mt-3">
            <DateTimePicker value={dateTime} onChange={setDateTime} />
          </div>

          {/* ── Error ───────────────────────────────────────── */}
          {error && (
            <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </div>
          )}

          {/* ── Actions ─────────────────────────────────────── */}
          <div className="mt-5 flex gap-2.5">
            <button
              type="button"
              onClick={handleRequestClose}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold text-gray-400 transition-all hover:bg-white/10 active:scale-95"
            >
              {t.common.cancel}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !amount}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 py-3.5 text-sm font-black text-gray-950 shadow-lg shadow-amber-500/25 transition-all hover:shadow-amber-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-5 w-5" />}
              {saving ? t.common.saving : t.capture.saveEntry}
            </button>
          </div>
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={showConfirmClose}
        title={t.capture.cancelConfirmTitle}
        description={t.capture.cancelConfirmDesc}
        confirmLabel={t.capture.cancelConfirmButton}
        cancelLabel={t.common.cancel}
        onConfirm={handleConfirmDiscard}
        onCancel={() => setShowConfirmClose(false)}
        destructive
      />

      <Toast
        message={t.quickAdd.successToast}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />

      {/* Milestone celebration */}
      {milestone && (
        <MilestoneModal
          open={true}
          onClose={() => setMilestone(null)}
          milestoneKey={milestone.key}
          emoji={milestone.emoji}
          days={milestone.days}
        />
      )}

      {/* Budget exceeded modal */}
      <ConfirmDialog
        open={budgetAlert.show}
        title={budgetAlert.title}
        description={budgetAlert.desc}
        confirmLabel={t.common.confirm}
        cancelLabel={t.common.cancel}
        onConfirm={() => setBudgetAlert({ show: false, title: "", desc: "" })}
        onCancel={() => setBudgetAlert({ show: false, title: "", desc: "" })}
      />

      {/* Budget warning toast */}
      <Toast
        message={budgetWarningToast.message}
        visible={budgetWarningToast.visible}
        type="error"
        onHide={() => setBudgetWarningToast({ visible: false, message: "" })}
        duration={4000}
      />

      {/* Subscription detection toast */}
      <Toast
        message={subscriptionToast.name ? t.ocr.subscriptionDetected.replace("{name}", subscriptionToast.name) : ""}
        visible={subscriptionToast.visible}
        onHide={() => setSubscriptionToast({ visible: false, name: "" })}
        duration={5000}
      />
    </>
  );
}
