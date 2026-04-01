"use client";

import { Delete as DeleteIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumpadProps {
  onKey: (key: string) => void;
  onDelete: () => void;
}

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "del"],
];

export function Numpad({ onKey, onDelete }: NumpadProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.flat().map((key) => {
        const isDel = key === "del";
        return (
          <button
            key={key}
            type="button"
            onClick={() => (isDel ? onDelete() : onKey(key))}
            className={cn(
              "flex h-14 items-center justify-center rounded-xl text-xl font-semibold transition-all active:scale-95",
              isDel
                ? "bg-white/5 text-gray-400 hover:bg-white/10"
                : "bg-white/5 text-white hover:bg-white/10"
            )}
          >
            {isDel ? <DeleteIcon className="h-5 w-5" /> : key}
          </button>
        );
      })}
    </div>
  );
}
