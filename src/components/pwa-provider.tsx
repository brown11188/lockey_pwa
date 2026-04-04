"use client";

import { useServiceWorker } from "@/hooks/use-service-worker";
import { OfflineBanner } from "@/components/offline-banner";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useServiceWorker();

  return (
    <>
      <OfflineBanner />
      {children}
    </>
  );
}
