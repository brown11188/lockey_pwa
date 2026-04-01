import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import bcrypt from "bcryptjs";

const sqlite = new Database(process.env.DATABASE_URL ?? "./data/app.db");
const db = drizzle(sqlite, { schema });

async function seed() {
  // Create demo user
  const hashedPassword = await bcrypt.hash("password123", 12);
  await db
    .insert(schema.users)
    .values({
      id: crypto.randomUUID(),
      email: "demo@lockey.app",
      name: "Demo User",
      hashedPassword,
      role: "user",
    })
    .onConflictDoNothing();

  console.log("Seed complete");
  console.log("Demo account: demo@lockey.app / password123");
}

seed()
  .then(() => {
    sqlite.close();
  })
  .catch(console.error);
