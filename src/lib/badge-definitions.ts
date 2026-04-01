import type { Translations } from "@/lib/i18n";

export interface BadgeDefinition {
  id: string;
  emoji: string;
  nameKey: keyof Translations["badges"];
  requirement: string; // English fallback description
  category: "consistency" | "category" | "financial";
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Consistency badges
  { id: "first_expense", emoji: "🌱", nameKey: "firstExpense", requirement: "Log your first expense", category: "consistency" },
  { id: "streak_7", emoji: "🔥", nameKey: "streak7", requirement: "7-day logging streak", category: "consistency" },
  { id: "streak_30", emoji: "🏆", nameKey: "streak30", requirement: "30-day logging streak", category: "consistency" },
  { id: "photos_50", emoji: "📸", nameKey: "photos50", requirement: "Log 50 photo expenses", category: "consistency" },
  // Category badges
  { id: "food_lover", emoji: "🍜", nameKey: "foodLover", requirement: "10 food expenses in a month", category: "category" },
  { id: "traveler", emoji: "✈️", nameKey: "traveler", requirement: "3 travel expenses", category: "category" },
  { id: "gamer", emoji: "🎮", nameKey: "gamer", requirement: "5 entertainment expenses", category: "category" },
  // Financial badges
  { id: "disciplined", emoji: "💪", nameKey: "disciplined", requirement: "Stay within budget all month", category: "financial" },
  { id: "saver", emoji: "💰", nameKey: "saver", requirement: "Spend 20%+ less than last month", category: "financial" },
];

export const STREAK_MILESTONES = [
  { days: 3, key: "three" as const, emoji: "🌱" },
  { days: 7, key: "seven" as const, emoji: "🔥" },
  { days: 14, key: "fourteen" as const, emoji: "⚡" },
  { days: 30, key: "thirty" as const, emoji: "🏆" },
  { days: 60, key: "sixty" as const, emoji: "💎" },
  { days: 100, key: "hundred" as const, emoji: "👑" },
];

export function getLevelInfo(totalExpenses: number) {
  if (totalExpenses >= 500) return { level: 5, name: "legend" as const, emoji: "👑", min: 500, max: 999 };
  if (totalExpenses >= 201) return { level: 4, name: "expert" as const, emoji: "🏅", min: 201, max: 500 };
  if (totalExpenses >= 51) return { level: 3, name: "manager" as const, emoji: "📊", min: 51, max: 200 };
  if (totalExpenses >= 11) return { level: 2, name: "tracker" as const, emoji: "📝", min: 11, max: 50 };
  return { level: 1, name: "beginner" as const, emoji: "🌱", min: 0, max: 10 };
}
