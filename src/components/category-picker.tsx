"use client";

import { useRef, useEffect } from "react";
import { CATEGORIES } from "@/lib/constants";
import { getCategoryInfo } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Translations } from "@/lib/i18n";

interface CategoryPickerProps {
  value: string;
  onChange: (value: string) => void;
  translations?: Translations["categories"];
  /** "grid" = 3-col grid (default), "scroll" = horizontal scrollable row */
  layout?: "grid" | "scroll";
}

export function CategoryPicker({
  value,
  onChange,
  translations,
  layout = "grid",
}: CategoryPickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected chip on mount (scroll layout only)
  useEffect(() => {
    if (layout !== "scroll" || !scrollRef.current) return;
    const selected = scrollRef.current.querySelector("[data-selected=true]");
    if (selected) {
      selected.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [value, layout]);

  const chips = CATEGORIES.map((cat) => {
    const info = getCategoryInfo(cat.value, translations);
    const isSelected = value === cat.value;
    return (
      <button
        key={cat.value}
        type="button"
        data-selected={isSelected}
        onClick={() => onChange(cat.value)}
        className={cn(
          "rounded-xl border px-3 py-2.5 text-sm font-medium transition-all whitespace-nowrap",
          isSelected
            ? "border-amber-500 bg-amber-500/20 text-amber-300"
            : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20",
          layout === "scroll" && "flex-shrink-0"
        )}
      >
        {info.emoji} {info.label}
      </button>
    );
  });

  if (layout === "scroll") {
    return (
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {chips}
      </div>
    );
  }

  return <div className="grid grid-cols-3 gap-2">{chips}</div>;
}
