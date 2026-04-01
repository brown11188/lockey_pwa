"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";

interface MilestoneModalProps {
  open: boolean;
  onClose: () => void;
  milestoneKey: "three" | "seven" | "fourteen" | "thirty" | "sixty" | "hundred";
  emoji: string;
  days: number;
}

export function MilestoneModal({ open, onClose, milestoneKey, emoji, days }: MilestoneModalProps) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; emoji: string; delay: number }>>([
  ]);

  useEffect(() => {
    if (open) {
      setVisible(true);
      // Generate confetti particles
      const emojis = ["🎉", "⭐", "🔥", "🌟", "🏆", "💫", "✨"];
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        delay: Math.random() * 0.8,
      }));
      setParticles(newParticles);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimating(true)));
    } else {
      setAnimating(false);
      const timer = setTimeout(() => {
        setVisible(false);
        setParticles([]);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!visible) return null;

  const message = t.streak.milestones[milestoneKey];

  return (
    <div
      className={cn(
        "fixed inset-0 z-[80] flex items-center justify-center transition-all duration-400",
        animating ? "bg-black/80 backdrop-blur-md" : "bg-transparent"
      )}
      onClick={onClose}
    >
      {/* Confetti particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className={cn(
            "pointer-events-none absolute text-2xl transition-all",
            animating ? "opacity-100" : "opacity-0"
          )}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            transitionDelay: `${p.delay}s`,
            transitionDuration: "1.5s",
            transform: animating
              ? `translateY(${Math.random() * 60 - 30}px) scale(${0.8 + Math.random() * 0.6})`
              : "translateY(-40px) scale(0)",
          }}
        >
          {p.emoji}
        </div>
      ))}

      <div
        className={cn(
          "relative z-10 mx-6 w-full max-w-xs rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900 to-amber-950/30 border border-amber-500/20 p-8 text-center shadow-2xl shadow-amber-500/10 transition-all duration-500",
          animating ? "scale-100 opacity-100" : "scale-75 opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            "mx-auto mb-4 text-7xl transition-all duration-700",
            animating ? "scale-100 animate-bounce" : "scale-50"
          )}
        >
          {emoji}
        </div>

        <h2 className="text-2xl font-black text-white">
          {message}
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          {t.streak.days.replace("{count}", String(days))}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-amber-500 py-3 font-bold text-gray-950 transition-all hover:bg-amber-400 active:scale-[0.98]"
        >
          {t.streak.keepGoing}
        </button>
      </div>
    </div>
  );
}
