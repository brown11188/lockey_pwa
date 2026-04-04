import { db } from "@/lib/db";
import { subscriptions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSessionUser } from "@/lib/get-session-user";
import { SubscriptionsScreen } from "@/components/subscriptions-screen";
import type { Subscription } from "@/db/schema";

// Server component — prefetches subscriptions so the page renders with data immediately
export default async function SubscriptionsPage() {
  const user = await getSessionUser();

  if (!user) {
    // Not authenticated — render without initial data; AuthLayout will redirect
    return <SubscriptionsScreen />;
  }

  let initialSubs: Subscription[] | undefined;
  try {
    const rows = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .orderBy(desc(subscriptions.createdAt));
    initialSubs = rows as Subscription[];
  } catch {
    // Fallback: render without initial data on error
  }

  return <SubscriptionsScreen initialSubs={initialSubs} />;
}