import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdminUser } from "@/lib/get-admin-user";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdminUser();
  if (error) return error;

  const { id } = await params;
  const results = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, id))
    .orderBy(desc(subscriptions.createdAt));

  return NextResponse.json(results);
}
