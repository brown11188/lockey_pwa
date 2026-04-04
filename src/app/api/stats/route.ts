import { NextRequest, NextResponse } from "next/server";
import { computeStats } from "@/lib/compute-stats";
import { getSessionUser, unauthorizedResponse } from "@/lib/get-session-user";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const view = (req.nextUrl.searchParams.get("view") ?? "week") as "week" | "month";
  const data = await computeStats(user.id, view);
  return NextResponse.json(data);
}
