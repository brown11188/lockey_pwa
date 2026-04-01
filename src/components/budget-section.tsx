"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { useCurrency } from "@/lib/currency-context";
import { useLanguage } from "@/lib/language-context";
import { formatCurrency } from "@/lib/format";
import { CATEGORIES, getCategoryInfo } from "@/lib/constants";
import { Toast, triggerHaptic } from "@/components/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Target as TargetIcon,
  Plus as PlusIcon,
  Trash2 as Trash2Icon,
} from "lucide-react";
import type { Budget } from "@/db/schema";

interface BudgetWithSpent extends Budget {
  spent: number;
}

interface SetBudgetModalProps {
  open: boolean;
  categoryId: string;
  categoryLabel: string;
  currentAmount: number;
  isRecurring: boolean;
  onClose: () => void;
  onSave: (categoryId: string, amount: number, isRecurring: boolean) => void;
}

function SetBudgetModal({ open, categoryId, categoryLabel, currentAmount, isRecurring: initRecurring, onClose, onSave }: SetBudgetModalProps) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(true);

  useEffect(() => {
    if (open) {
      setAmount(currentAmount > 0 ? String(currentAmount) : "");
      setIsRecurring(initRecurring);
    }
  }, [open, currentAmount, initRecurring]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-6 w-full max-w-sm rounded-2xl border border-white/10 bg-gray-900 p-6">
        <h3 className="text-lg font-bold text-white">
          {t.budget.setBudgetTitle} — {categoryLabel}
        </h3>
        <div className="mt-4">
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
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
              const val = parseFloat(amount);
              if (val > 0) onSave(categoryId, val, isRecurring);
            }}
            disabled={!amount || parseFloat(amount) <= 0}
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
  const [modalCategory, setModalCategory] = useState("");
  const [modalLabel, setModalLabel] = useState("");
  const [modalAmount, setModalAmount] = useState(0);
  const [modalRecurring, setModalRecurring] = useState(true);
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

  const openSetBudget = useCallback((catId: string, catLabel: string, current: number, recurring: boolean) => {
    setModalCategory(catId);
    setModalLabel(catLabel);
    setModalAmount(current);
    setModalRecurring(recurring);
    setModalOpen(true);
  }, []);

  const handleSaveBudget = useCallback(async (categoryId: string, amount: number, isRecurring: boolean) => {
    try {
      await apiFetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, monthlyBudget: amount, currency, isRecurring }),
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

  // Categories that have budgets
  const budgetedCategories = useMemo(
    () => new Set(budgetsData.map((b) => b.categoryId)),
    [budgetsData]
  );

  // Categories without budgets
  const unbugdetedCategories = useMemo(
    () => CATEGORIES.filter((c) => !budgetedCategories.has(c.value)),
    [budgetedCategories]
  );

  // Calculate current week of month
  const now = new Date();
  const dayOfMonth = now.getDate();
  const weekOfMonth = Math.ceil(dayOfMonth / 7);
  const totalWeeks = Math.ceil(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() / 7);

  if (loading) return null;

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-400">
          <TargetIcon className="h-4 w-4" />
          {t.budget.title}
        </h2>
      </div>

      {budgetsData.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center">
          <p className="text-sm text-gray-500">{t.budget.noBudgets}</p>
          <p className="mt-1 text-xs text-gray-600">{t.budget.noBudgetsHint}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {budgetsData.map((b) => {
            const info = getCategoryInfo(b.categoryId, t.categories);
            const pct = b.monthlyBudget > 0 ? Math.round((b.spent / b.monthlyBudget) * 100) : 0;
            const remaining = b.monthlyBudget - b.spent;
            const exceeded = pct >= 100;

            return (
              <div
                key={b.id}
                className={`rounded-2xl border p-4 transition-all ${
                  exceeded
                    ? "border-red-500/20 bg-red-500/5 animate-[shake_0.5s_ease-in-out]"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{info.emoji}</span>
                    <span className="text-sm font-semibold text-white">{info.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {weekOfMonth}/{totalWeeks} {t.budget.weekLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => openSetBudget(b.categoryId, `${info.emoji} ${info.label}`, b.monthlyBudget, b.isRecurring)}
                      className="text-xs text-amber-400 hover:text-amber-300"
                    >
                      {t.common.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteBudget(b)}
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
                    {formatCurrency(b.spent, currency)} / {formatCurrency(b.monthlyBudget, currency)}
                  </span>
                  <span className={`text-xs font-semibold ${
                    exceeded ? "text-red-400" : pct >= 71 ? "text-yellow-400" : "text-gray-500"
                  }`}>
                    {exceeded
                      ? t.budget.exceededLabel
                      : `${t.budget.remaining}: ${formatCurrency(Math.max(remaining, 0), currency)} (${pct}%)`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Show inline "Set budget" for unbudgeted categories */}
      {unbugdetedCategories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {unbugdetedCategories.slice(0, 6).map((cat) => {
            const info = getCategoryInfo(cat.value, t.categories);
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => openSetBudget(cat.value, `${info.emoji} ${info.label}`, 0, true)}
                className="flex items-center gap-1 rounded-lg border border-dashed border-white/10 bg-transparent px-2.5 py-1.5 text-xs text-gray-500 transition-colors hover:border-amber-500/30 hover:text-amber-400"
              >
                <PlusIcon className="h-3 w-3" />
                {info.emoji} {t.budget.setBudget}
              </button>
            );
          })}
        </div>
      )}

      {/* Set Budget Modal */}
      <SetBudgetModal
        open={modalOpen}
        categoryId={modalCategory}
        categoryLabel={modalLabel}
        currentAmount={modalAmount}
        isRecurring={modalRecurring}
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