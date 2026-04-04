"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { useCurrency } from "@/lib/currency-context";
import { useLanguage } from "@/lib/language-context";
import { formatCurrency } from "@/lib/format";
import { Toast, triggerHaptic } from "@/components/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Target as TargetIcon,
  Trash2 as Trash2Icon,
} from "lucide-react";
import type { Budget } from "@/db/schema";

const ALL_CATEGORIES_ID = "__all__";

interface BudgetWithSpent extends Budget {
  spent: number;
}

interface SetBudgetModalProps {
  open: boolean;
  currentAmount: number;
  isRecurring: boolean;
  currency: string;
  onClose: () => void;
  onSave: (amount: number, isRecurring: boolean) => void;
}

function SetBudgetModal({ open, currentAmount, isRecurring: initRecurring, currency, onClose, onSave }: SetBudgetModalProps) {
  const { t } = useLanguage();
  const [rawAmount, setRawAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(true);

  useEffect(() => {
    if (open) {
      setRawAmount(currentAmount > 0 ? String(currentAmount) : "");
      setIsRecurring(initRecurring);
    }
  }, [open, currentAmount, initRecurring]);

  const formatDisplay = (raw: string): string => {
    if (!raw) return "";
    const parts = raw.split(".");
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const formatted = parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
    return currency === "VND" ? `${formatted}\u20AB` : `$${formatted}`;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const stripped = e.target.value.replace(/[^0-9.]/g, "");
    // Keep only the first decimal point
    const parts = stripped.split(".");
    const cleaned = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : parts[0];
    setRawAmount(cleaned);
  };

  if (!open) return null;

  const numericValue = parseFloat(rawAmount) || 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-6 w-full max-w-sm rounded-2xl border border-white/10 bg-gray-900 p-6">
        <h3 className="text-lg font-bold text-white">
          {t.budget.setBudgetTitle}
        </h3>
        <div className="mt-4">
          <input
            type="text"
            inputMode="decimal"
            value={formatDisplay(rawAmount)}
            onChange={handleAmountChange}
            placeholder={t.budget.amountPlaceholder}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xl font-bold text-amber-400 placeholder:text-gray-600 focus:border-amber-500/50 focus:outline-none"
            autoFocus
          />
        </div>
        <div className="mt-4">
          <label className="mb-2 block text-sm text-gray-400">{t.budget.applyTo}</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsRecurring(false)}
              className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                !isRecurring
                  ? "border-amber-500 bg-amber-500/20 text-amber-300"
                  : "border-white/10 bg-white/5 text-gray-400"
              }`}
            >
              {t.budget.thisMonth}
            </button>
            <button
              type="button"
              onClick={() => setIsRecurring(true)}
              className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                isRecurring
                  ? "border-amber-500 bg-amber-500/20 text-amber-300"
                  : "border-white/10 bg-white/5 text-gray-400"
              }`}
            >
              {t.budget.allMonths}
            </button>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-gray-300 transition-all hover:bg-white/10"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={() => {
              if (numericValue > 0) onSave(numericValue, isRecurring);
            }}
            disabled={!rawAmount || numericValue <= 0}
            className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-bold text-gray-950 transition-all hover:bg-amber-400 disabled:opacity-40"
          >
            {t.common.save}
          </button>
        </div>
      </div>
    </div>
  );
}

function getProgressColor(pct: number): string {
  if (pct >= 100) return "bg-red-500";
  if (pct >= 91) return "bg-orange-500";
  if (pct >= 71) return "bg-yellow-500";
  return "bg-green-500";
}

export function BudgetSection() {
  const { currency } = useCurrency();
  const { t } = useLanguage();
  const [budgetsData, setBudgetsData] = useState<BudgetWithSpent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteBudget, setDeleteBudget] = useState<BudgetWithSpent | null>(null);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" as "success" | "error" });

  const fetchBudgets = useCallback(async () => {
    try {
      const res = await apiFetch("/api/budgets");
      if (res.ok) setBudgetsData(await res.json());
    } catch {
      console.error("Failed to fetch budgets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Global budget is the single budget for all categories
  const globalBudget = useMemo(
    () => budgetsData.find((b) => b.categoryId === ALL_CATEGORIES_ID) ?? null,
    [budgetsData]
  );

  const handleSaveBudget = useCallback(async (amount: number, isRecurring: boolean) => {
    try {
      await apiFetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: ALL_CATEGORIES_ID, monthlyBudget: amount, currency, isRecurring }),
      });
      triggerHaptic();
      setModalOpen(false);
      setToast({ visible: true, message: t.budget.saved, type: "success" });
      fetchBudgets();
    } catch {
      setToast({ visible: true, message: "Failed to save", type: "error" });
    }
  }, [currency, fetchBudgets, t.budget.saved]);

  const handleDeleteBudget = useCallback(async () => {
    if (!deleteBudget) return;
    try {
      await apiFetch(`/api/budgets/${deleteBudget.id}`, { method: "DELETE" });
      setBudgetsData((prev) => prev.filter((b) => b.id !== deleteBudget.id));
      setDeleteBudget(null);
      triggerHaptic();
    } catch {
      console.error("Failed to delete budget");
    }
  }, [deleteBudget]);

  // Calculate current week of month
  const now = new Date();
  const dayOfMonth = now.getDate();
  const weekOfMonth = Math.ceil(dayOfMonth / 7);
  const totalWeeks = Math.ceil(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() / 7);

  if (loading) return null;

  const pct = globalBudget && globalBudget.monthlyBudget > 0
    ? Math.round((globalBudget.spent / globalBudget.monthlyBudget) * 100)
    : 0;
  const exceeded = pct >= 100;

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-400">
          <TargetIcon className="h-4 w-4" />
          {t.budget.title}
        </h2>
      </div>

      {!globalBudget ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center">
          <p className="text-sm text-gray-500">{t.budget.noBudgets}</p>
          <p className="mt-1 text-xs text-gray-600">{t.budget.noBudgetsHint}</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-500/30"
          >
            + {t.budget.setBudget}
          </button>
        </div>
      ) : (
        <div
          className={`rounded-2xl border p-4 transition-all ${
            exceeded
              ? "animate-[shake_0.5s_ease-in-out] border-red-500/20 bg-red-500/5"
              : "border-white/10 bg-white/5"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TargetIcon className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">{t.budget.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {weekOfMonth}/{totalWeeks} {t.budget.weekLabel}
              </span>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="text-xs text-amber-400 hover:text-amber-300"
              >
                {t.common.edit}
              </button>
              <button
                type="button"
                onClick={() => setDeleteBudget(globalBudget)}
                className="text-gray-600 hover:text-red-400"
              >
                <Trash2Icon className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(pct)}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {formatCurrency(globalBudget.spent, currency)} / {formatCurrency(globalBudget.monthlyBudget, currency)}
            </span>
            <span
              className={`text-xs font-semibold ${
                exceeded ? "text-red-400" : pct >= 71 ? "text-yellow-400" : "text-gray-500"
              }`}
            >
              {exceeded
                ? t.budget.exceededLabel
                : `${t.budget.remaining}: ${formatCurrency(Math.max(globalBudget.monthlyBudget - globalBudget.spent, 0), currency)} (${pct}%)`}
            </span>
          </div>
        </div>
      )}

      {/* Set Budget Modal */}
      <SetBudgetModal
        open={modalOpen}
        currentAmount={globalBudget?.monthlyBudget ?? 0}
        isRecurring={globalBudget?.isRecurring ?? true}
        currency={currency}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveBudget}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteBudget}
        title={t.budget.deleteBudget}
        description={t.budget.deleteConfirm}
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        onConfirm={handleDeleteBudget}
        onCancel={() => setDeleteBudget(null)}
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