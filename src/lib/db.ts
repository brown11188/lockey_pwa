import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@/db/schema";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const dbPath = process.env.DATABASE_URL ?? "./data/app.db";

const dir = dirname(dbPath);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

const globalForDb = global as unknown as { sqlite: InstanceType<typeof Database> };

if (!globalForDb.sqlite) {
  globalForDb.sqlite = new Database(dbPath);
  globalForDb.sqlite.pragma("journal_mode = WAL");
  globalForDb.sqlite.pragma("busy_timeout = 5000");
}

const sqlite = globalForDb.sqlite;

export const db = drizzle(sqlite, { schema });
