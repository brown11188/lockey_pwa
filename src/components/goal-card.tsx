"use client";

import { useCallback, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import type { SavingGoal } from "@/db/schema";

interface GoalCardProps {
  goal: SavingGoal;
  currencySymbol: string;
  onEdit: (goal: SavingGoal) => void;
  onDelete: (id: string) => void;
  onAddFunds: () => void;
}

function formatAmount(n: number): string {
  return n >= 1000 ? n.toLocaleString() : String(n);
}

export function GoalCard({ goal, currencySymbol, onEdit, onDelete, onAddFunds }: GoalCardProps) {
  const { t } = useLanguage();
  const [addAmount, setAddAmount] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000)
    : null;

  const handleAddFunds = useCallback(async () => {
    const amt = parseFloat(addAmount);
    if (!amt || amt <= 0) return;
    setSaving(true);
    try {
      const newAmount = goal.currentAmount + amt;
      const isCompleted = newAmount >= goal.targetAmount;
      await apiFetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentAmount: newAmount, isCompleted }),
      });
      setAddAmount("");
      setShowAdd(false);
      onAddFunds();
    } catch {
      console.error("Failed to add funds");
    } finally {
      setSaving(false);
    }
  }, [addAmount, goal, onAddFunds]);

  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{goal.emoji}</span>
          <div>
            <h3 className="font-semibold text-white">{goal.name}</h3>
            {daysLeft !== null && (
              <span className={`text-xs ${
                daysLeft < 0 ? "text-red-400" : daysLeft <= 7 ? "text-amber-400" : "text-gray-500"
              }`}>
                {daysLeft < 0 ? t.goals.overdue : `${daysLeft} ${t.goals.daysLeft}`}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={() => onEdit(goal)} className="rounded-lg p-1.5 text-gray-500 hover:bg-white/10 hover:text-white">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => onDelete(goal.id)} className="rounded-lg p-1.5 text-gray-500 hover:bg-red-500/10 hover:text-red-400">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm font-bold text-white">
            {currencySymbol}{formatAmount(goal.currentAmount)}
          </span>
          <span className="text-xs text-gray-500">
            / {currencySymbol}{formatAmount(goal.targetAmount)}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              goal.isCompleted ? "bg-green-500" : "bg-amber-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-xs text-gray-500">{Math.round(pct)}% {t.goals.progress}</span>
          <span className="text-xs text-gray-500">
            {currencySymbol}{formatAmount(remaining)} {t.goals.remaining}
          </span>
        </div>
      </div>

      {/* Add funds */}
      {!goal.isCompleted && (
        <div className="mt-3">
          {showAdd ? (
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder={t.goals.addFundsPlaceholder}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-amber-500/50"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddFunds}
                disabled={saving || !addAmount}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-gray-950 hover:bg-amber-400 disabled:opacity-50"
              >
                {saving ? "..." : "+"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/10 py-2 text-xs font-medium text-gray-400 hover:border-amber-500/30 hover:text-amber-400"
            >
              <Plus className="h-3.5 w-3.5" />
              {t.goals.addFunds}
            </button>
          )}
        </div>
      )}

      {/* Completed badge */}
      {goal.isCompleted && (
        <div className="mt-3 rounded-xl bg-green-500/10 px-3 py-2 text-center text-sm font-medium text-green-400">
          {t.goals.congrats}
        </div>
      )}
    </div>
  );
}
