"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { OnboardingProvider } from "@/lib/onboarding-context";
import { Onboarding } from "@/components/onboarding";
import { BottomTabs } from "@/components/bottom-tabs";

const AUTH_PATHS = ["/login", "/register", "/reset-password"];
const ADMIN_PATHS = ["/admin"];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isAdminPage = ADMIN_PATHS.some((p) => pathname.startsWith(p));

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

  // While loading session, show a splash
  if (status === "loading") {
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
  }

  // Authenticated: render the full app shell with onboarding + bottom tabs
  return (
    <OnboardingProvider>
      <Onboarding />
      <main className="mx-auto max-w-lg">{children}</main>
      <BottomTabs />
    </OnboardingProvider>
  );
}
