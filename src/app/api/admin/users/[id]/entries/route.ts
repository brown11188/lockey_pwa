import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { entries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdminUser } from "@/lib/get-admin-user";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdminUser();
  if (error) return error;

  const { id } = await params;
  const results = await db
    .select()
    .from(entries)
    .where(eq(entries.userId, id))
    .orderBy(desc(entries.createdAt));

  return NextResponse.json(results);
}
