import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
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

  const adminPassword = await bcrypt.hash("admin123", 12);
  await db
    .insert(schema.users)
    .values({
      id: crypto.randomUUID(),
      email: "admin@lockey.app",
      name: "Admin",
      hashedPassword: adminPassword,
      role: "admin",
    })
    .onConflictDoNothing();

  console.log("Seed complete");
  console.log("Demo account: demo@lockey.app / password123");
  console.log("Admin account: admin@lockey.app / admin123");
}

seed().catch(console.error);
