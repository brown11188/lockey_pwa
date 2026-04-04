"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, memo } from "react";
import dynamic from "next/dynamic";
import { BottomTabs } from "@/components/bottom-tabs";

// Lazy-load onboarding — only needed on first visit, not on every navigation
const OnboardingProvider = dynamic(
  () => import("@/lib/onboarding-context").then((m) => ({ default: m.OnboardingProvider })),
  { ssr: false }
);
const Onboarding = dynamic(
  () => import("@/components/onboarding").then((m) => ({ default: m.Onboarding })),
  { ssr: false }
);

const AUTH_PATHS = ["/login", "/register", "/reset-password"];
const ADMIN_PATHS = ["/admin"];

// Memoized splash to prevent re-creation
const Splash = memo(function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-3xl font-black text-gray-950">
          L
        </div>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    </div>
  );
});

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isAdminPage = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  // Track whether we've ever been authenticated — prevents flash to splash
  // on client-side navigations when useSession briefly returns "loading"
  const wasAuthenticated = useRef(false);
  if (status === "authenticated") wasAuthenticated.current = true;

  useEffect(() => {
    if (!isAuthPage && status === "unauthenticated") {
      router.replace("/login");
    }
  }, [isAuthPage, status, router]);

  // On auth pages, render children directly (no bottom tabs/onboarding)
  if (isAuthPage) {
    return <main className="mx-auto max-w-lg">{children}</main>;
  }

  // Admin pages render their own layout — bypass the PWA shell entirely
  if (isAdminPage) {
    return <>{children}</>;
  }

  // Show splash ONLY on initial session load, not on route transitions
  if (status === "loading" && !wasAuthenticated.current) {
    return <Splash />;
  }

  // Authenticated (or was authenticated): render the full app shell
  return (
    <OnboardingProvider>
      <Onboarding />
      <main className="mx-auto max-w-lg">{children}</main>
      <BottomTabs />
    </OnboardingProvider>
  );
}
