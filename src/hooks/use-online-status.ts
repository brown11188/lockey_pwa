"use client";

import { useState, useEffect, useCallback } from "react";
import {
  addToQueue,
  processQueue,
  getQueueCount,
  type QueuedItem,
} from "@/lib/offline-queue";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Refresh queue count
  const refreshQueueCount = useCallback(async () => {
    try {
      const count = await getQueueCount();
      setQueueCount(count);
    } catch {
      // IndexedDB not available
    }
  }, []);

  // Sync queued mutations
  const syncQueue = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;
    setIsSyncing(true);
    try {
      const { synced } = await processQueue();
      if (synced > 0) {
        console.log(`[Sync] Synced ${synced} queued items`);
      }
      await refreshQueueCount();
    } catch (err) {
      console.warn("[Sync] Failed:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshQueueCount]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    refreshQueueCount();

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      syncQueue();
    };
    const handleOffline = () => setIsOnline(false);

    // Listen to SW messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "QUEUE_MUTATION") {
        const item: QueuedItem = event.data.item;
        addToQueue(item).then(refreshQueueCount);
      }
      if (event.data?.type === "TRIGGER_SYNC") {
        syncQueue();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    navigator.serviceWorker?.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
    };
  }, [refreshQueueCount, syncQueue]);

  return { isOnline, queueCount, isSyncing, syncQueue, refreshQueueCount };
}
