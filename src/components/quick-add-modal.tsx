"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { X as XIcon, Loader as LoaderIcon, Camera as CameraIcon } from "lucide-react";
import { Numpad } from "@/components/numpad";
import { CategoryPicker } from "@/components/category-picker";
import { Toast, triggerHaptic } from "@/components/toast";
import { DateTimePicker } from "@/components/datetime-picker";
import { useCurrency } from "@/lib/currency-context";
import { useLanguage } from "@/lib/language-context";
import { apiFetch } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/http";
import { toLocalDateTimeString, parseLocalDateTimeString } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useBudgetAlert } from "@/hooks/use-budget-alert";
import { MilestoneModal } from "@/components/milestone-modal";

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialDate?: string; // YYYY-MM-DD — pre-fills the date picker when set
}

export function QuickAddModal({ open, onClose, onSaved, initialDate }: QuickAddModalProps) {
  const { currency } = useCurrency();
  const { t } = useLanguage();
  const { checkBudget } = useBudgetAlert();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rawAmount, setRawAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [dateTime, setDateTime] = useState(toLocalDateTimeString(new Date()));
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [budgetAlert, setBudgetAlert] = useState<{ show: boolean; title: string; desc: string }>({ show: false, title: "", desc: "" });
  const [budgetWarningToast, setBudgetWarningToast] = useState({ visible: false, message: "" });
  const [milestone, setMilestone] = useState<{ key: "three" | "seven" | "fourteen" | "thirty" | "sixty" | "hundred"; emoji: string; days: number } | null>(null);
  const [animating, setAnimating] = useState(false);
  const [visible, setVisible] = useState(open);

  // Animation control
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimating(true)));
    }
    if (!open && prevOpenRef.current) {
      setAnimating(false);
      setTimeout(() => setVisible(false), 300);
    }
    prevOpenRef.current = open;
  }, [open]);

  // Seed the date picker whenever the modal opens
  useEffect(() => {
    if (open) {
      if (initialDate) {
        setDateTime(toLocalDateTimeString(new Date(`${initialDate}T12:00:00`)));
      } else {
        setDateTime(toLocalDateTimeString(new Date()));
      }
    }
  }, [open, initialDate]);

  const formatDisplay = useCallback(
    (raw: string): string => {
      if (!raw) return "";
      const parts = raw.split(".");
      const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      const formatted = parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
      return currency === "VND" ? `${formatted}\u20AB` : `$${formatted}`;
    },
    [currency]
  );

  const handleNumKey = useCallback((key: string) => {
    setRawAmount((prev) => {
      if (key === "." && prev.includes(".")) return prev;
      if (prev.length >= 15) return prev;
      return prev + key;
    });
    setError("");
  }, []);

  const handleDelete = useCallback(() => {
    setRawAmount((prev) => prev.slice(0, -1));
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoBlob(file);
    setPhotoPreview(URL.createObjectURL(file));
  }, []);

  const resetForm = useCallback(() => {
    setRawAmount("");
    setCategory("");
    setNote("");
    setDateTime(toLocalDateTimeString(new Date()));
    setPhotoBlob(null);
    setPhotoPreview(null);
    setError("");
    setToastVisible(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSave = useCallback(async () => {
    const numericAmount = parseFloat(rawAmount);
    if (!rawAmount || isNaN(numericAmount) || numericAmount <= 0) {
      setError(t.quickAdd.enterAmount);
      return;
    }
    if (!category) {
      setError(t.capture.fillAmount.replace(t.capture.fillAmount, t.capture.category));
      return;
    }

    setSaving(true);
    setError("");

    try {
      let photoId: string | null = null;
      let photoUri: string | null = null;

      // If photo attached, use combined multipart upload+entry in ONE call
      if (photoBlob) {
        const formData = new FormData();
        formData.append("photo", photoBlob, "photo.jpg");
        formData.append("amount", String(numericAmount));
        formData.append("currency", currency);
        formData.append("category", category);
        formData.append("note", note);
        formData.append("createdAt", dateTime ? parseLocalDateTimeString(dateTime).toISOString() : new Date().toISOString());

        const entryRes = await apiFetch("/api/entries", {
          method: "POST",
          body: formData,
        });
        if (!entryRes.ok) throw new Error(await getApiErrorMessage(entryRes, t.capture.failedSave));
      } else {
        // No photo — use JSON
        const entryRes = await apiFetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: numericAmount,
            currency,
            category,
            note,
            createdAt: dateTime ? parseLocalDateTimeString(dateTime).toISOString() : new Date().toISOString(),
          }),
        });
        if (!entryRes.ok) throw new Error(await getApiErrorMessage(entryRes, t.capture.failedSave));
      }

      triggerHaptic();
      setToastVisible(true);

      // Navigate IMMEDIATELY — fire-and-forget streak + budget
      onSaved();
      handleClose();

      // Background: streak + budget check
      Promise.all([
        apiFetch("/api/streak", { method: "POST" }).catch(() => null),
        checkBudget(category).catch(() => null),
      ]).catch(() => {});
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t.capture.failedSave);
    } finally {
      setSaving(false);
    }
  }, [rawAmount, category, photoBlob, currency, note, dateTime, t, onSaved, handleClose, checkBudget]);

  const canSave = rawAmount && parseFloat(rawAmount) > 0 && category;

  if (!visible) return null;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 flex flex-col bg-gray-950 transition-all duration-300",
          animating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 safe-top">
          <h2 className="text-lg font-bold text-white">{t.quickAdd.title}</h2>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex flex-1 flex-col overflow-y-auto px-4">
          {/* Amount display */}
          <div className="flex items-center justify-center py-4">
            <span
              className={cn(
                "text-center font-bold transition-colors",
                rawAmount ? "text-amber-400" : "text-gray-600",
                rawAmount.length > 10 ? "text-3xl" : "text-5xl"
              )}
            >
              {rawAmount ? formatDisplay(rawAmount) : (currency === "VND" ? "0\u20AB" : "$0")}
            </span>
          </div>

          {error && (
            <div className="mb-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-center text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Numpad */}
          <div className="mx-auto w-full max-w-xs">
            <Numpad onKey={handleNumKey} onDelete={handleDelete} />
          </div>

          {/* Category grid */}
          <div className="mt-5">
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

          {/* Optional photo */}
          <div className="mt-4 flex items-center gap-3">
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Attached"
                  className="h-14 w-14 rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={() => { setPhotoBlob(null); setPhotoPreview(null); }}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-gray-400"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm text-gray-500 transition-all hover:border-white/20 hover:text-gray-400"
              >
                <CameraIcon className="h-4 w-4" />
                {t.quickAdd.addPhoto}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Save button */}
          <div className="mt-6 pb-8 safe-bottom">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !canSave}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-4 font-bold text-gray-950 transition-all hover:bg-amber-400 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <LoaderIcon className="h-5 w-5 animate-spin" />
              ) : null}
              {saving ? t.common.saving : t.quickAdd.saveButton}
            </button>
          </div>
        </div>
      </div>

      <Toast
        message={t.quickAdd.successToast}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />

      {/* Budget exceeded modal */}
      {budgetAlert.show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-6 w-full max-w-sm rounded-2xl border border-red-500/20 bg-gray-900 p-6">
            <h3 className="text-lg font-bold text-white">{budgetAlert.title}</h3>
            <p className="mt-2 text-sm text-gray-400">{budgetAlert.desc}</p>
            <button
              type="button"
              onClick={() => setBudgetAlert({ show: false, title: "", desc: "" })}
              className="mt-4 w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-gray-950 hover:bg-amber-400"
            >
              {t.common.confirm}
            </button>
          </div>
        </div>
      )}

      {/* Budget warning toast */}
      <Toast
        message={budgetWarningToast.message}
        visible={budgetWarningToast.visible}
        type="error"
        onHide={() => setBudgetWarningToast({ visible: false, message: "" })}
        duration={4000}
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
    </>
  );
}
