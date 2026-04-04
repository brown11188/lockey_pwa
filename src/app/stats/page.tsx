import { getSessionUser } from "@/lib/get-session-user";
import { computeStats, type StatsData } from "@/lib/compute-stats";
import { StatsScreen } from "@/components/stats-screen";

// Server component — prefetches stats data (week view) so the page renders with data immediately
export default async function StatsPage() {
  const user = await getSessionUser();

  if (!user) {
    // Not authenticated — render without initial data; AuthLayout will redirect
    return <StatsScreen />;
  }

  let initialStats: StatsData | undefined;
  try {
    initialStats = await computeStats(user.id, "week");
  } catch {
    // Fallback: render without initial data on error
  }

  return <StatsScreen initialStats={initialStats} />;
}
