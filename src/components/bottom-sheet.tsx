"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  /** If true, calls onRequestClose instead of onClose when tapping backdrop */
  confirmClose?: boolean;
  onRequestClose?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({
  open,
  onClose,
  confirmClose = false,
  onRequestClose,
  children,
  className,
}: BottomSheetProps) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimating(true));
      });
    } else {
      setAnimating(false);
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleBackdropClick = useCallback(() => {
    if (confirmClose && onRequestClose) {
      onRequestClose();
    } else {
      onClose();
    }
  }, [confirmClose, onRequestClose, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          animating ? "opacity-100" : "opacity-0"
        )}
        onClick={handleBackdropClick}
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "relative z-10 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-gray-900 transition-transform duration-300 ease-out",
          animating ? "translate-y-0" : "translate-y-full",
          className
        )}
      >
        {/* Drag handle */}
        <div className="sticky top-0 z-10 flex justify-center bg-gray-900 pb-2 pt-3">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>
        {children}
      </div>
    </div>
  );
}
