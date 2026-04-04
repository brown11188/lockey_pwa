"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

interface SearchFilterBarProps {
  value: string;
  onChange: (value: string) => void;
  onToggleFilter: () => void;
  filterCount: number;
}

export function SearchFilterBar({
  value,
  onChange,
  onToggleFilter,
  filterCount,
}: SearchFilterBarProps) {
  const { t } = useLanguage();
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [localValue, setLocalValue] = useState(value);

  // Sync external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setLocalValue(v);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onChange(v), 300);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    setLocalValue("");
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <div className="flex items-center gap-2">
      <div
        className={`relative flex flex-1 items-center rounded-xl border transition-all ${
          focused
            ? "border-amber-500/50 bg-white/10"
            : "border-white/10 bg-white/5"
        }`}
      >
        <Search className="ml-3 h-4 w-4 shrink-0 text-gray-500" />
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={t.search.placeholder}
          className="w-full bg-transparent px-2 py-2.5 text-sm text-white placeholder-gray-500 outline-none"
        />
        {localValue && (
          <button
            type="button"
            onClick={handleClear}
            className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-gray-400 hover:text-white"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleFilter}
        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all ${
          filterCount > 0
            ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
            : "border-white/10 bg-white/5 text-gray-400 hover:text-white"
        }`}
      >
        <SlidersHorizontal className="h-4 w-4" />
        {filterCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-gray-950">
            {filterCount}
          </span>
        )}
      </button>
    </div>
  );
}
