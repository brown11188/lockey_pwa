"use client";

import { useCallback } from "react";
import { apiFetch } from "@/lib/api";

interface BudgetCheckResult {
  hasBudget: boolean;
  categoryId?: string;
  monthlyBudget?: number;
  spent?: number;
  pct?: number;
  exceeded?: boolean;
  warning?: boolean;
}

/**
 * Hook to check budget status after saving an expense.
 * Returns a function that checks the budget for a given category.
 */
export function useBudgetAlert() {
  const checkBudget = useCallback(async (categoryId: string): Promise<BudgetCheckResult> => {
    try {
      const res = await apiFetch("/api/budgets/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId }),
      });
      if (!res.ok) return { hasBudget: false };
      return await res.json();
    } catch {
      return { hasBudget: false };
    }
  }, []);

  return { checkBudget };
}