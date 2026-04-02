import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, entries, subscriptions } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { requireAdminUser } from "@/lib/get-admin-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdminUser();
  if (error) return error;

  const allUsers = await db.select().from(users).orderBy(users.createdAt);

  const userIds = allUsers.map((u) => u.id);

  const entryCounts = await db
    .select({ userId: entries.userId, count: count() })
    .from(entries)
    .groupBy(entries.userId);

  const subCounts = await db
    .select({ userId: subscriptions.userId, count: count() })
    .from(subscriptions)
    .groupBy(subscriptions.userId);

  const entryMap = Object.fromEntries(entryCounts.map((r) => [r.userId, r.count]));
  const subMap = Object.fromEntries(subCounts.map((r) => [r.userId, r.count]));

  const result = allUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    entryCount: entryMap[u.id] ?? 0,
    subscriptionCount: subMap[u.id] ?? 0,
  }));

  return NextResponse.json(result);
}
