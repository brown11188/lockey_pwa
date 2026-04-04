"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { useCurrency } from "@/lib/currency-context";
import type { SavingGoal } from "@/db/schema";

const EMOJIS = ["🎯", "💰", "✈️", "📱", "🏠", "🚗", "🎓", "💎", "🎮", "👕", "🎉", "⭐"];

interface GoalFormModalProps {
  open: boolean;
  goal: SavingGoal | null;
  onClose: () => void;
  onSaved: () => void;
}

export function GoalFormModal({ open, goal, onClose, onSaved }: GoalFormModalProps) {
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (goal) {
        setName(goal.name);
        setEmoji(goal.emoji);
        setTargetAmount(String(goal.targetAmount));
        setDeadline(goal.deadline ?? "");
      } else {
        setName("");
        setEmoji("🎯");
        setTargetAmount("");
        setDeadline("");
      }
    }
  }, [open, goal]);

  const handleSubmit = useCallback(async () => {
    if (!name.trim() || !targetAmount) return;
    setSaving(true);
    try {
      if (goal) {
        await apiFetch(`/api/goals/${goal.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, emoji, targetAmount, deadline: deadline || null }),
        });
      } else {
        await apiFetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, emoji, targetAmount, currency, deadline: deadline || null }),
        });
      }
      onSaved();
    } catch {
      console.error("Failed to save goal");
    } finally {
      setSaving(false);
    }
  }, [name, emoji, targetAmount, deadline, currency, goal, onSaved]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-slide-up rounded-t-2xl border-t border-white/10 bg-gray-900 px-4 pb-8 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {goal ? t.goals.editGoal : t.goals.newGoal}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">{t.goals.emoji}</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-all ${
                    emoji === e ? "bg-amber-500/20 ring-2 ring-amber-500" : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">{t.goals.name}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.goals.namePlaceholder}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Target amount */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">{t.goals.target}</label>
            <input
              type="number"
              inputMode="numeric"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-400">{t.goals.deadline}</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500/50 [color-scheme:dark]"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !name.trim() || !targetAmount}
          className="mt-6 w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-gray-950 hover:bg-amber-400 disabled:opacity-50"
        >
          {saving ? t.common.saving : t.goals.save}
        </button>
      </div>
    </div>
  );
}
