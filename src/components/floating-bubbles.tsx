"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/format";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BubblePlanet {
  id: string;
  name: string;
  monthly: number;
  monthlyUSD: number;
  amount: number;
  currency: string;
  cycle: string;
  color: string;
}

interface FloatingBubbleItem {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  name: string;
  monthly: number;
  currency: string;
  cycle: string;
  amount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CANVAS_HEIGHT = 240;
const DEFAULT_CANVAS_WIDTH = 320;

function shortAmountBubble(amount: number, currency: string): string {
  if (currency === "VND") {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M₫`;
    if (amount >= 1_000) return `${Math.round(amount / 1_000)}K₫`;
    return `${Math.round(amount)}₫`;
  }
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}k`;
  return `$${amount.toFixed(0)}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FloatingBubbles({ planets }: { planets: BubblePlanet[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef<FloatingBubbleItem[]>([]);
  const [tooltip, setTooltip] = useState<{
    bubble: FloatingBubbleItem;
    cx: number;
    cy: number;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !planets.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth || DEFAULT_CANVAS_WIDTH;
    const H = CANVAS_HEIGHT;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const maxUSD = Math.max(...planets.map((p) => p.monthlyUSD), 1);
    const minR = 22;
    const maxR = 54;

    stateRef.current = planets.map((p) => {
      const r = minR + (p.monthlyUSD / maxUSD) * (maxR - minR);
      const margin = r + 4;
      return {
        id: p.id,
        x: margin + Math.random() * Math.max(1, W - 2 * margin),
        y: margin + Math.random() * Math.max(1, H - 2 * margin),
        vx: (Math.random() - 0.5) * 1.1,
        vy: (Math.random() - 0.5) * 1.1,
        r,
        color: p.color,
        name: p.name,
        monthly: p.monthly,
        currency: p.currency,
        cycle: p.cycle,
        amount: p.amount,
      };
    });

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      for (const b of stateRef.current) {
        const glow = ctx.createRadialGradient(b.x, b.y, b.r * 0.4, b.x, b.y, b.r * 1.6);
        glow.addColorStop(0, b.color + "2a");
        glow.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        const grad = ctx.createRadialGradient(
          b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.05,
          b.x, b.y, b.r
        );
        grad.addColorStop(0, b.color + "ee");
        grad.addColorStop(0.55, b.color + "99");
        grad.addColorStop(1, b.color + "44");
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = b.color + "88";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const shine = ctx.createRadialGradient(
          b.x - b.r * 0.32, b.y - b.r * 0.42, 0,
          b.x - b.r * 0.18, b.y - b.r * 0.28, b.r * 0.52
        );
        shine.addColorStop(0, "rgba(255,255,255,0.42)");
        shine.addColorStop(1, "rgba(255,255,255,0)");
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = shine;
        ctx.fill();

        const fontSize = Math.max(8, Math.min(13, b.r * 0.32));
        ctx.font = `bold ${fontSize}px system-ui,sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        const label = b.name.length > 9 ? b.name.slice(0, 8) + "…" : b.name;
        ctx.fillText(label, b.x, b.y - fontSize * 0.55);

        ctx.font = `${Math.max(7, fontSize * 0.82)}px system-ui,sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.72)";
        ctx.fillText(shortAmountBubble(Math.round(b.monthly), b.currency), b.x, b.y + fontSize * 0.85);
      }
    };

    const tick = () => {
      for (const b of stateRef.current) {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx); }
        if (b.x + b.r > W) { b.x = W - b.r; b.vx = -Math.abs(b.vx); }
        if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy); }
        if (b.y + b.r > H) { b.y = H - b.r; b.vy = -Math.abs(b.vy); }
      }
      draw();
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [planets]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const scaleX = (canvas.width / dpr) / rect.width;
    const scaleY = (canvas.height / dpr) / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const found = stateRef.current.find((b) => {
      const dx = b.x - mx;
      const dy = b.y - my;
      return Math.sqrt(dx * dx + dy * dy) <= b.r;
    }) ?? null;

    if (found) {
      setTooltip({ bubble: found, cx: e.clientX - rect.left, cy: e.clientY - rect.top });
    } else {
      setTooltip(null);
    }
  }, []);

  return (
    <div ref={containerRef} className="relative px-5 pb-5">
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl border border-white/5"
        style={{ height: CANVAS_HEIGHT, cursor: tooltip ? "pointer" : "default" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      />
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-xl border border-white/10 bg-gray-900/95 p-3 text-xs shadow-2xl backdrop-blur-sm"
          style={{
            left: Math.min(
              tooltip.cx + 14,
              (containerRef.current?.offsetWidth ?? DEFAULT_CANVAS_WIDTH) - 160,
            ),
            top: Math.max(4, tooltip.cy - 14),
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: tooltip.bubble.color }}
            />
            <span className="font-bold text-white">{tooltip.bubble.name}</span>
          </div>
          <p className="text-gray-400 capitalize">{tooltip.bubble.cycle}</p>
          <p className="mt-1 font-semibold text-amber-400">
            {formatCurrency(tooltip.bubble.amount, tooltip.bubble.currency)}
            <span className="text-gray-500 font-normal">
              /{tooltip.bubble.cycle === "yearly" ? "yr" : tooltip.bubble.cycle === "weekly" ? "wk" : "mo"}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
