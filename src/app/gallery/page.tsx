import { db } from "@/lib/db";
import { entries, streaks } from "@/db/schema";
import { getSessionUser } from "@/lib/get-session-user";
import { eq, desc } from "drizzle-orm";
import { GalleryScreen } from "@/components/gallery-screen";
import type { Entry } from "@/db/schema";

// Server component — prefetches entries + streak so the page renders with data immediately (Fix #7)
export default async function GalleryPage() {
  const user = await getSessionUser();

  if (!user) {
    // Not authenticated — render without initial data; AuthLayout will redirect
    return <GalleryScreen />;
  }

  try {
    const [userEntries, streakRows] = await Promise.all([
      db
        .select()
        .from(entries)
        .where(eq(entries.userId, user.id))
        .orderBy(desc(entries.createdAt)),
      db
        .select()
        .from(streaks)
        .where(eq(streaks.userId, user.id))
        .limit(1),
    ]);

    const currentStreak = streakRows[0]?.currentStreak ?? 0;

    return (
      <GalleryScreen
        initialEntries={userEntries as Entry[]}
        initialStreak={currentStreak}
      />
    );
  } catch {
    // Fallback: render without initial data on DB error
    return <GalleryScreen />;
  }
}
