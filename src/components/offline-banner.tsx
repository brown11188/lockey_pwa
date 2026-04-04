"use client";

import { useOnlineStatus } from "@/hooks/use-online-status";
import { useLanguage } from "@/lib/language-context";
import { WifiOff, RefreshCw, Cloud, Loader2 } from "lucide-react";

export function OfflineBanner() {
  const { isOnline, queueCount, isSyncing, syncQueue } = useOnlineStatus();
  const { t } = useLanguage();

  // Show syncing indicator
  if (isOnline && isSyncing) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-blue-600 text-white text-center py-2 px-4 text-sm flex items-center justify-center gap-2 animate-slide-down">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{t.offline?.syncing ?? "Syncing..."}</span>
      </div>
    );
  }

  // Show pending queue when online
  if (isOnline && queueCount > 0) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-600 text-white text-center py-2 px-4 text-sm flex items-center justify-center gap-2">
        <Cloud className="h-4 w-4" />
        <span>
          {(t.offline?.pendingSync ?? "{count} pending").replace(
            "{count}",
            String(queueCount)
          )}
        </span>
        <button
          onClick={syncQueue}
          className="ml-2 bg-white/20 hover:bg-white/30 rounded-full px-3 py-0.5 text-xs font-medium transition-colors"
        >
          {t.offline?.syncNow ?? "Sync now"}
        </button>
      </div>
    );
  }

  // Show offline banner
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white text-center py-2 px-4 text-sm flex items-center justify-center gap-2 animate-slide-down">
        <WifiOff className="h-4 w-4" />
        <span>{t.offline?.banner ?? "You are offline"}</span>
        {queueCount > 0 && (
          <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">
            {queueCount} {t.offline?.queued ?? "queued"}
          </span>
        )}
      </div>
    );
  }

  return null;
}
