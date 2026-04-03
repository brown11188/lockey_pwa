"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import {
  Camera as CameraIcon,
  LayoutGrid as LayoutGridIcon,
  BarChart3 as BarChart3Icon,
  CreditCard as CreditCardIcon,
  Users as UsersIcon,
} from "lucide-react";

export function BottomTabs() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const tabs = [
    { href: "/gallery", label: t.tabs.gallery, icon: LayoutGridIcon },
    { href: "/camera", label: t.tabs.capture, icon: CameraIcon },
    { href: "/stats", label: t.tabs.stats, icon: BarChart3Icon },
    { href: "/subscriptions", label: t.tabs.subscriptions, icon: CreditCardIcon },
    { href: "/family", label: "Family", icon: UsersIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-gray-950/95 backdrop-blur-lg safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors",
                isActive
                  ? "text-amber-400"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              <tab.icon
                className={cn(
                  "h-5 w-5",
                  isActive && "drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                )}
              />
              <span className="font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
