import {
  pgTable,
  text,
  integer,
  real,
  serial,
  boolean,
  timestamp,
  primaryKey,
  customType,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Custom bytea type for binary photo data
const bytea = customType<{ data: Buffer; driverData: Buffer | string }>({
  dataType() {
    return "bytea";
  },
  toDriver(val: Buffer) {
    return val;
  },
  fromDriver(val: Buffer | string): Buffer {
    if (typeof val === "string") {
      return Buffer.from(val.replace(/^\\x/, ""), "hex");
    }
    return val as Buffer;
  },
});

// ─── Users ──────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  name: text("name"),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  hashedPassword: text("hashed_password"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// ─── Auth.js Adapter Tables ─────────────────────────────────────────────────

export const accounts = pgTable(
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

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.identifier, t.token] }),
  })
);

// ─── Photos (stored as bytea in DB to prevent data loss) ─────────────────────

export const photos = pgTable("photos", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  data: bytea("data").notNull(),
  mimeType: text("mime_type").notNull().default("image/jpeg"),
  size: integer("size").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// ─── App Tables ─────────────────────────────────────────────────────────────

export const entries = pgTable(
  "entries",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    photoId: text("photo_id").references(() => photos.id, {
      onDelete: "set null",
    }),
    photoUri: text("photo_uri"),
    amount: real("amount").notNull(),
    currency: text("currency").notNull().default("VND"),
    category: text("category").notNull(),
    note: text("note").default(""),
    createdAt: text("created_at")
      .notNull()
      .default(sql`to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`),
  },
  (t) => ({
    userCreatedIdx: index("idx_entries_user_created").on(t.userId, t.createdAt),
  })
);

export const settings = pgTable(
  "settings",
  {
    key: text("key").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.key, t.userId] }),
    userIdIdx: index("idx_settings_user_id").on(t.userId),
  })
);

// ─── Subscriptions ──────────────────────────────────────────────────────────

export const subscriptions = pgTable("subscriptions", {
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
  cycle: text("cycle").notNull().default("monthly"),
  nextRenewalDate: text("next_renewal_date").notNull(),
  categoryId: text("category_id"),
  note: text("note").default(""),
  reminderDaysBefore: integer("reminder_days_before").notNull().default(3),
  isActive: boolean("is_active").notNull().default(true),
  isShared: boolean("is_shared").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// ─── Families ───────────────────────────────────────────────────────────────

export const families = pgTable("families", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  inviteCode: text("invite_code").notNull().unique(),
  monthlyBudget: real("monthly_budget"),
  budgetCurrency: text("budget_currency").notNull().default("VND"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const familyMembers = pgTable(
  "family_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    familyId: text("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // "owner" | "member"
    isPrivate: boolean("is_private").notNull().default(false),
    joinedAt: timestamp("joined_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => ({
    uniq: unique().on(t.familyId, t.userId),
  })
);

// ─── Budgets ────────────────────────────────────────────────────────────────

export const budgets = pgTable(
  "budgets",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: text("category_id").notNull(),
    monthlyBudget: real("monthly_budget").notNull(),
    currency: text("currency").notNull().default("VND"),
    isRecurring: boolean("is_recurring").notNull().default(true),
    appliedFrom: text("applied_from").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (t) => ({
    userIdIdx: index("idx_budgets_user_id").on(t.userId),
  })
);

// ─── Streaks ────────────────────────────────────────────────────────────────

export const streaks = pgTable(
  "streaks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    lastLoggedDate: text("last_logged_date"),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (t) => ({
    userIdIdx: index("idx_streaks_user_id").on(t.userId),
  })
);

// ─── Badges ─────────────────────────────────────────────────────────────────

export const badges = pgTable("badges", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  badgeId: text("badge_id").notNull(),
  earnedAt: timestamp("earned_at", { mode: "date" }).notNull().defaultNow(),
});

// ─── Wrapped Dismissals ─────────────────────────────────────────────────────

export const wrappedDismissals = pgTable("wrapped_dismissals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  monthKey: text("month_key").notNull(),
  dismissedAt: timestamp("dismissed_at", { mode: "date" })
    .notNull()
    .defaultNow(),
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
export type Family = typeof families.$inferSelect;
export type NewFamily = typeof families.$inferInsert;
export type FamilyMember = typeof familyMembers.$inferSelect;
export type NewFamilyMember = typeof familyMembers.$inferInsert;
