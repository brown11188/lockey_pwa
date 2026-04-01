"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Check as CheckIcon } from "lucide-react";

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  duration?: number;
  type?: "success" | "error";
}

export function Toast({ message, visible, onHide, duration = 2000, type = "success" }: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onHide, 300);
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible, duration, onHide]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-8 z-[100] flex justify-center pointer-events-none">
      <div
        className={cn(
          "pointer-events-auto flex items-center gap-2 rounded-2xl px-5 py-3 shadow-2xl transition-all duration-300",
          type === "success"
            ? "bg-green-500/20 border border-green-500/30 text-green-300"
            : "bg-red-500/20 border border-red-500/30 text-red-300",
          show ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        )}
      >
        {type === "success" && <CheckIcon className="h-4 w-4" />}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

/** Simple helper to trigger haptic feedback */
export function triggerHaptic(ms = 50) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(ms);
  }
}
