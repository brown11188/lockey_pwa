"use client";

import dynamic from "next/dynamic";

// ssr: false is only allowed in Client Components in Next.js 16 (Turbopack)
const PWAProvider = dynamic(
  () => import("@/components/pwa-provider").then((m) => ({ default: m.PWAProvider })),
  { ssr: false }
);

export function PWAProviderLazy({ children }: { children: React.ReactNode }) {
  return <PWAProvider>{children}</PWAProvider>;
}
