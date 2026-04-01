import { sqliteTable, text, integer, real, primaryKey, blob } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── Users ──────────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  name: text("name"),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  image: text("image"),
  hashedPassword: text("hashed_password"),
  role: text("role").notNull().default("user"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdateFn(() => new Date()),
});

// ─── Auth.js Adapter Tables ─────────────────────────────────────────────────

export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
  })
);

export const sessions = sqliteTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.identifier, t.token] }),
  })
);

// ─── Photos (stored as BLOB in DB to prevent data loss) ─────────────────────

export const photos = sqliteTable("photos", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  data: blob("data", { mode: "buffer" }).notNull(),
  mimeType: text("mime_type").notNull().default("image/jpeg"),
  size: integer("size").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── App Tables ─────────────────────────────────────────────────────────────

export const entries = sqliteTable("entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  photoId: text("photo_id")
    .references(() => photos.id, { onDelete: "set null" }),
  // Keep photoUri for backward compat during migration, nullable now
  photoUri: text("photo_uri"),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("VND"),
  category: text("category").notNull(),
  note: text("note").default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const settings = sqliteTable("settings", {
  key: text("key").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  value: text("value").notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.key, t.userId] }),
}));

// ─── Subscriptions ──────────────────────────────────────────────────────────

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("VND"),
  cycle: text("cycle").notNull().default("monthly"), // weekly | monthly | yearly
  nextRenewalDate: text("next_renewal_date").notNull(), // YYYY-MM-DD
  categoryId: text("category_id"),
  note: text("note").default(""),
  reminderDaysBefore: integer("reminder_days_before").notNull().default(3),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdateFn(() => new Date()),
});

// ─── Budgets ────────────────────────────────────────────────────────────────

export const budgets = sqliteTable("budgets", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: text("category_id").notNull(),
  monthlyBudget: real("monthly_budget").notNull(),
  currency: text("currency").notNull().default("VND"),
  isRecurring: integer("is_recurring", { mode: "boolean" }).notNull().default(true),
  appliedFrom: text("applied_from").notNull(), // YYYY-MM-01
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdateFn(() => new Date()),
});

// ─── Streaks ────────────────────────────────────────────────────────────────

export const streaks = sqliteTable("streaks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastLoggedDate: text("last_logged_date"), // YYYY-MM-DD
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdateFn(() => new Date()),
});

// ─── Badges ─────────────────────────────────────────────────────────────────

export const badges = sqliteTable("badges", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  badgeId: text("badge_id").notNull(), // e.g. "streak_7", "first_expense"
  earnedAt: integer("earned_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Wrapped Dismissals ─────────────────────────────────────────────────────

export const wrappedDismissals = sqliteTable("wrapped_dismissals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  monthKey: text("month_key").notNull(), // e.g. "2026-03" (the PREVIOUS month)
  dismissedAt: integer("dismissed_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ─── Type Exports ───────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;
export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;
export type Streak = typeof streaks.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type WrappedDismissal = typeof wrappedDismissals.$inferSelect;
