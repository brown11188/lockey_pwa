"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus as PlusIcon, Camera as CameraIcon, Zap as ZapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";

interface FabButtonProps {
  onQuickAdd: () => void;
}

export function FabButton({ onQuickAdd }: FabButtonProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => setExpanded((p) => !p), []);

  // Close on outside click
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [expanded]);

  const handleCamera = useCallback(() => {
    setExpanded(false);
    router.push("/camera");
  }, [router]);

  const handleQuickAdd = useCallback(() => {
    setExpanded(false);
    onQuickAdd();
  }, [onQuickAdd]);

  return (
    <div ref={fabRef} className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3">
      {/* Mini FABs */}
      <div
        className={cn(
          "flex flex-col items-end gap-2 transition-all duration-200",
          expanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        {/* Camera option */}
        <button
          type="button"
          onClick={handleCamera}
          className="flex items-center gap-2 rounded-full bg-gray-800 pl-4 pr-2 py-2 shadow-lg border border-white/10 transition-all hover:bg-gray-700"
        >
          <span className="text-sm font-medium text-white">{t.fab.takePhoto}</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500">
            <CameraIcon className="h-5 w-5 text-gray-950" />
          </div>
        </button>

        {/* Quick add option */}
        <button
          type="button"
          onClick={handleQuickAdd}
          className="flex items-center gap-2 rounded-full bg-gray-800 pl-4 pr-2 py-2 shadow-lg border border-white/10 transition-all hover:bg-gray-700"
        >
          <span className="text-sm font-medium text-white">{t.fab.quickAdd}</span>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500">
            <ZapIcon className="h-5 w-5 text-gray-950" />
          </div>
        </button>
      </div>

      {/* Main FAB */}
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 shadow-[0_4px_20px_rgba(245,158,11,0.4)] transition-all duration-200 hover:bg-amber-400 active:scale-90",
          expanded && "rotate-45"
        )}
      >
        <PlusIcon className="h-7 w-7 text-gray-950" />
      </button>
    </div>
  );
}
