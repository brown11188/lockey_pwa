"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Target, Trash2, TrendingUp } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { useCurrency } from "@/lib/currency-context";
import { CURRENCY_SYMBOLS } from "@/lib/constants";
import type { SavingGoal } from "@/db/schema";
import { GoalFormModal } from "@/components/goal-form-modal";
import { GoalCard } from "@/components/goal-card";

export function GoalsScreen() {
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingGoal | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await apiFetch("/api/goals");
      if (res.ok) setGoals(await res.json());
    } catch {
      console.error("Failed to fetch goals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleSaved = useCallback(() => {
    setFormOpen(false);
    setEditGoal(null);
    fetchGoals();
  }, [fetchGoals]);

  const handleDelete = useCallback(async (id: string) => {
    await apiFetch(`/api/goals/${id}`, { method: "DELETE" });
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;

  return (
    <div className="min-h-screen bg-gray-950 px-4 pb-24 pt-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">{t.goals.title}</h2>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-gray-950 hover:bg-amber-400"
        >
          <Plus className="h-3.5 w-3.5" />
          {t.goals.newGoal}
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <TrendingUp className="h-8 w-8 text-gray-600" />
          </div>
          <p className="text-lg font-medium text-gray-400">{t.goals.noGoals}</p>
          <p className="text-sm text-gray-600">{t.goals.noGoalsHint}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeGoals.length > 0 && (
            <div className="space-y-3">
              {activeGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  currencySymbol={sym}
                  onEdit={(g) => { setEditGoal(g); setFormOpen(true); }}
                  onDelete={handleDelete}
                  onAddFunds={fetchGoals}
                />
              ))}
            </div>
          )}

          {completedGoals.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-500">
                ✅ {t.goals.completed} ({completedGoals.length})
              </h3>
              <div className="space-y-3 opacity-60">
                {completedGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    currencySymbol={sym}
                    onEdit={(g) => { setEditGoal(g); setFormOpen(true); }}
                    onDelete={handleDelete}
                    onAddFunds={fetchGoals}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <GoalFormModal
        open={formOpen}
        goal={editGoal}
        onClose={() => { setFormOpen(false); setEditGoal(null); }}
        onSaved={handleSaved}
      />
    </div>
  );
}
