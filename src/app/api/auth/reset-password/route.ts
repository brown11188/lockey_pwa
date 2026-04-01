import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const dynamic = "force-dynamic";

const resetSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: "Email not found" },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

    await db
      .update(users)
      .set({ hashedPassword })
      .where(eq(users.email, email));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[reset-password] Error:", err);
    return NextResponse.json(
      { error: "Reset failed" },
      { status: 500 }
    );
  }
}
