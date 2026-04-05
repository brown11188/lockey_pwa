import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@/db/schema";

const dbPath = process.env.DATABASE_URL ?? "./data/app.db";

// Singleton pattern — prevents multiple connections in Next.js dev (hot reload)
const globalForDb = global as unknown as { sqlite: Database.Database };

const sqlite = globalForDb.sqlite ?? new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("busy_timeout = 5000");

globalForDb.sqlite = sqlite;

export const db = drizzle(sqlite, { schema });
