"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Loader as LoaderIcon, Check as CheckIcon, Sparkles as SparklesIcon } from "lucide-react";
import { BottomSheet } from "@/components/bottom-sheet";
import { CategoryPicker } from "@/components/category-picker";
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
        <div className="px-4 pb-8 pt-1">
          {/* Photo thumbnail + amount row */}
          <div className="flex items-start gap-4">
            <img
              src={photoPreview}
              alt="Captured"
              className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
            />
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-500">
                {t.capture.amount} ({currency === "VND" ? "\u20AB" : "$"})
              </label>
              <div className="relative">
                <input
                  ref={amountRef}
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => formatAmountInput(e.target.value)}
                  placeholder={currency === "VND" ? "50,000" : "25.00"}
                  className={cn(
                    "w-full rounded-xl border bg-white/5 px-4 py-3 text-2xl font-bold placeholder:text-gray-600 focus:outline-none focus:ring-1",
                    scanning
                      ? "animate-pulse border-amber-500/30 text-gray-600 focus:border-amber-500/50 focus:ring-amber-500/50"
                      : autoFilled
                        ? "border-amber-500/50 text-amber-400 focus:border-amber-500/50 focus:ring-amber-500/50"
                        : "border-white/10 text-amber-400 focus:border-amber-500/50 focus:ring-amber-500/50"
                  )}
                />
                {scanning && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <LoaderIcon className="h-4 w-4 animate-spin text-amber-400" />
                  </div>
                )}
              </div>
              {scanning && (
                <p className="mt-1 text-xs text-amber-400/60">{t.ocr.scanning}</p>
              )}
              {autoFilled && !scanning && (
                <p className="mt-1 flex items-center gap-1 text-xs text-amber-400/80">
                  <SparklesIcon className="h-3 w-3" />
                  {t.ocr.autoFilled}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Category picker */}
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              {t.capture.category}
            </label>
            <CategoryPicker
              value={category}
              onChange={setCategory}
              translations={t.categories}
              layout="scroll"
            />
          </div>

          {/* Note */}
          <div className="mt-4">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.capture.notePlaceholder}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
          </div>

          {/* Date/Time */}
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              {t.capture.dateTime}
            </label>
            <DateTimePicker value={dateTime} onChange={setDateTime} />
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleRequestClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3.5 text-sm font-medium text-gray-300 transition-all hover:bg-white/10"
            >
              {t.common.cancel}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !amount}
              className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 font-bold text-gray-950 transition-all hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <LoaderIcon className="h-4 w-4 animate-spin" />
              ) : (
                <CheckIcon className="h-4 w-4" />
              )}
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
