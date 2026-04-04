"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { findKnownService } from "@/lib/known-services";
import { convertTotalsMap, type ExchangeRates } from "@/lib/currency-utils";
import type { Subscription } from "@/db/schema";

// ─── Helpers ────────────────────────────────────────────────────────────────

const PALETTE = [
  "#f59e0b", "#60a5fa", "#a78bfa", "#34d399",
  "#f472b6", "#22d3ee", "#fb923c", "#a3e635",
];

function calcMonthly(amount: number, cycle: string): number {
  if (cycle === "weekly") return amount * (52 / 12);
  if (cycle === "yearly") return amount / 12;
  return amount;
}

// Normalize to USD for cross-currency comparison (sizing, chart axes)
function toUSD(amount: number, currency: string, rates: ExchangeRates): number {
  return currency === "VND" ? amount / (rates["VND"] ?? 25000) : amount;
}

/** Count how many times a subscription renews from today through endDate (inclusive). */
function countPayments(nextRenewalDate: string, cycle: string, endDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  let next = new Date(nextRenewalDate + "T00:00:00");
  let count = 0;
  let guard = 0;
  while (next <= end && guard++ < 1000) {
    if (next >= today) count++;
    if (cycle === "monthly") next = new Date(next.getFullYear(), next.getMonth() + 1, next.getDate());
    else if (cycle === "yearly") next = new Date(next.getFullYear() + 1, next.getMonth(), next.getDate());
    else if (cycle === "weekly") next = new Date(next.getTime() + 7 * 24 * 60 * 60 * 1000);
    else break;
  }
  return count;
}

function shortAmount(amount: number, currency: string): string {
  if (currency === "VND") {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M₫`;
    if (amount >= 1_000) return `${Math.round(amount / 1_000)}K₫`;
    return `${Math.round(amount)}₫`;
  }
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}k`;
  return `$${amount.toFixed(0)}`;
}

// ─── Orbit chart constants ───────────────────────────────────────────────────

const C = 140; // SVG center
const ORBIT_RADII = [50, 82, 114];
const ORBIT_SPEEDS = ["12s", "20s", "30s"]; // inner = fastest

// ─── Types ───────────────────────────────────────────────────────────────────

interface Planet extends Subscription {
  monthly: number;     // original monthly cost in subscription's own currency (for display)
  monthlyUSD: number;  // USD-normalized monthly cost (for sizing & sorting)
  orbitIdx: number;
  startAngle: number;
  radius: number;
  speed: string;
  size: number;
  color: string;
  logo: string;
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
  monthly: number;   // original monthly in own currency
  currency: string;
  cycle: string;
  amount: number;    // original amount (for tooltip)
}

// ─── Floating Bubbles visualization ─────────────────────────────────────────

const CANVAS_HEIGHT = 240;
const DEFAULT_CANVAS_WIDTH = 320;

function FloatingBubbles({ planets }: { planets: Planet[] }) {
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
        // Outer glow
        const glow = ctx.createRadialGradient(b.x, b.y, b.r * 0.4, b.x, b.y, b.r * 1.6);
        glow.addColorStop(0, b.color + "2a");
        glow.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Bubble body
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

        // Shine highlight
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

        // Label: subscription name
        const fontSize = Math.max(8, Math.min(13, b.r * 0.32));
        ctx.font = `bold ${fontSize}px system-ui,sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        const label = b.name.length > 9 ? b.name.slice(0, 8) + "…" : b.name;
        ctx.fillText(label, b.x, b.y - fontSize * 0.55);

        // Label: amount
        ctx.font = `${Math.max(7, fontSize * 0.82)}px system-ui,sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.72)";
        ctx.fillText(shortAmount(Math.round(b.monthly), b.currency), b.x, b.y + fontSize * 0.85);
      }
    };

    const tick = () => {
      for (const b of stateRef.current) {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x - b.r < 0)  { b.x = b.r;     b.vx =  Math.abs(b.vx); }
        if (b.x + b.r > W)  { b.x = W - b.r;  b.vx = -Math.abs(b.vx); }
        if (b.y - b.r < 0)  { b.y = b.r;     b.vy =  Math.abs(b.vy); }
        if (b.y + b.r > H)  { b.y = H - b.r;  b.vy = -Math.abs(b.vy); }
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

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  subscriptions: Subscription[];
  targetCurrency: string;
  exchangeRates: ExchangeRates;
  ratesLive: boolean;
}

type ChartView = "orbit" | "bubble";

export function SubscriptionOverview({ subscriptions, targetCurrency, exchangeRates, ratesLive }: Props) {
  const [chartView, setChartView] = useState<ChartView>("orbit");
  const active = useMemo(() => subscriptions.filter((s) => s.isActive), [subscriptions]);

  const planets = useMemo<Planet[]>(() => {
    if (!active.length) return [];
    const sorted = [...active]
      .map((s) => ({
        ...s,
        monthly: calcMonthly(s.amount, s.cycle),
        monthlyUSD: toUSD(calcMonthly(s.amount, s.cycle), s.currency, exchangeRates),
      }))
      .sort((a, b) => b.monthlyUSD - a.monthlyUSD);
    const maxMonthlyUSD = Math.max(...sorted.map((s) => s.monthlyUSD));

    const buckets: number[][] = [[], [], []];
    sorted.forEach((_, i) => buckets[i % 3].push(i));

    return sorted.map((sub, gi): Planet => {
      const orbitIdx = gi % 3;
      const pos = buckets[orbitIdx].indexOf(gi);
      const total = buckets[orbitIdx].length;
      const startAngle = (pos / total) * 360;
      const logo = sub.logoUrl || findKnownService(sub.name)?.logo || "💳";
      return {
        ...sub,
        orbitIdx,
        startAngle,
        radius: ORBIT_RADII[orbitIdx],
        speed: ORBIT_SPEEDS[orbitIdx],
        size: 7 + (sub.monthlyUSD / maxMonthlyUSD) * 13,
        color: PALETTE[gi % PALETTE.length],
        logo,
      };
    });
  }, [active, exchangeRates]);

  // Convert monthly totals to the user's selected currency
  const orbitMonthlyTotal = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of active) {
      map[s.currency] = (map[s.currency] || 0) + calcMonthly(s.amount, s.cycle);
    }
    return convertTotalsMap(map, targetCurrency, exchangeRates);
  }, [active, targetCurrency, exchangeRates]);

  // ── Spending Forecast ──────────────────────────────────────────────────────
  const forecastTotals = useMemo(() => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const endOfYear = new Date(now.getFullYear(), 11, 31);

    const thisMonth: Record<string, number> = {};
    const untilEOY: Record<string, number> = {};
    const fullYear: Record<string, number> = {};

    for (const s of active) {
      if (!s.isActive) continue;
      const cur = s.currency;
      const mCnt = countPayments(s.nextRenewalDate, s.cycle, endOfMonth);
      const yCnt = countPayments(s.nextRenewalDate, s.cycle, endOfYear);
      const monthly = calcMonthly(s.amount, s.cycle);
      thisMonth[cur] = (thisMonth[cur] || 0) + s.amount * mCnt;
      untilEOY[cur] = (untilEOY[cur] || 0) + s.amount * yCnt;
      fullYear[cur] = (fullYear[cur] || 0) + monthly * 12;
    }

    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000
    );
    const yearProgress = dayOfYear / 365;
    const currentMonth = now.getMonth() + 1;

    return {
      thisMonth: convertTotalsMap(thisMonth, targetCurrency, exchangeRates),
      untilEOY: convertTotalsMap(untilEOY, targetCurrency, exchangeRates),
      fullYear: convertTotalsMap(fullYear, targetCurrency, exchangeRates),
      yearProgress,
      currentMonth,
    };
  }, [active, targetCurrency, exchangeRates]);

  if (!active.length) return null;

  return (
    <div className="space-y-4">
      {/* ── Chart panel (Orbit / Bubble – switchable) ────────────── */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-gray-900/60 backdrop-blur-sm">
        {/* Header with toggle */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
              {chartView === "orbit" ? "Subscription Orbits" : "Subscription Bubbles"}
            </p>
            <p className="mt-0.5 text-xs text-gray-600">
              {chartView === "orbit"
                ? "Each planet = one subscription · size = monthly cost"
                : "Bubble size = monthly cost · hover to inspect"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {/* Chart switcher toggle */}
            <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5 text-[10px] font-semibold">
              <button
                onClick={() => setChartView("orbit")}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  chartView === "orbit"
                    ? "bg-amber-500/20 text-amber-400"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Orbit
              </button>
              <button
                onClick={() => setChartView("bubble")}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  chartView === "bubble"
                    ? "bg-amber-500/20 text-amber-400"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Bubble
              </button>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Active</p>
              <p className="text-lg font-bold leading-none text-white">{active.length}</p>
            </div>
          </div>
        </div>

        {chartView === "orbit" ? (
          <div className="flex flex-col items-center">
            {/* SVG orbit visualization */}
            <svg
              viewBox="0 0 280 280"
              className="w-full max-w-[300px]"
              style={{ overflow: "visible" }}
            >
              <defs>
                <radialGradient id="sub-center-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
                {planets.map((p) => (
                  <radialGradient key={`rg-${p.id}`} id={`pg-${p.id}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={p.color} stopOpacity="0.7" />
                    <stop offset="100%" stopColor={p.color} stopOpacity="0" />
                  </radialGradient>
                ))}
              </defs>

              <circle cx={C} cy={C} r="75" fill="url(#sub-center-glow)" />

              {ORBIT_RADII.map((r, i) => (
                <circle
                  key={i}
                  cx={C}
                  cy={C}
                  r={r}
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                  strokeDasharray="5 5"
                />
              ))}

              <circle
                cx={C}
                cy={C}
                r="38"
                fill="rgba(245,158,11,0.08)"
                stroke="rgba(245,158,11,0.2)"
                strokeWidth="1.5"
              />

              {/* Single converted monthly total */}
              <text x={C} y={C - 7} textAnchor="middle" fill="white" fontSize="10" fontWeight="700">
                {orbitMonthlyTotal.wasConverted ? "≈" : ""}{shortAmount(Math.round(orbitMonthlyTotal.total), targetCurrency)}
              </text>
              <text x={C} y={C + 8} textAnchor="middle" fill="rgba(156,163,175,0.8)" fontSize="7.5">
                per month
              </text>

              {/* Orbiting planets */}
              {planets.map((p) => (
                <g key={p.id}>
                  <circle
                    cx={C + p.radius}
                    cy={C}
                    r={p.size + 5}
                    fill={`url(#pg-${p.id})`}
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from={`${p.startAngle} ${C} ${C}`}
                      to={`${p.startAngle + 360} ${C} ${C}`}
                      dur={p.speed}
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle
                    cx={C + p.radius}
                    cy={C}
                    r={p.size}
                    fill={p.color}
                    fillOpacity="0.9"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from={`${p.startAngle} ${C} ${C}`}
                      to={`${p.startAngle + 360} ${C} ${C}`}
                      dur={p.speed}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              ))}
            </svg>

            {/* Legend */}
            <div className="grid w-full grid-cols-2 gap-x-6 gap-y-2.5 px-5 pb-5">
              {planets.map((p) => (
                <div key={p.id} className="flex items-center gap-2 min-w-0">
                  <div
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full shadow-sm"
                    style={{ backgroundColor: p.color, boxShadow: `0 0 6px ${p.color}80` }}
                  />
                  <span className="flex-1 truncate text-xs text-gray-400">{p.name}</span>
                  <span className="flex-shrink-0 text-xs font-semibold text-white">
                    {shortAmount(Math.round(p.monthly), p.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <FloatingBubbles planets={planets} />
        )}
      </div>

      {/* ── Spending Forecast ───────────────────────────────────── */}
      <div className="rounded-2xl border border-white/5 bg-gray-900/60 p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Spending Forecast
          </p>
          {ratesLive ? (
            <span className="flex items-center gap-1 text-[9px] text-emerald-400/80">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              live rates
            </span>
          ) : (
            <span className="text-[9px] text-gray-600">est. rates</span>
          )}
        </div>

        {/* 3 stat columns */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {(
            [
              { label: "This Month", data: forecastTotals.thisMonth },
              { label: "Until Year End", data: forecastTotals.untilEOY },
              { label: "Full Year Est.", data: forecastTotals.fullYear },
            ]
          ).map(({ label, data }) => (
            <div
              key={label}
              className="flex flex-col items-center rounded-xl border border-white/5 bg-white/5 p-3 gap-1"
            >
              <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500 text-center leading-tight">
                {label}
              </p>
              {data.total === 0 ? (
                <p className="text-sm font-bold text-gray-600">—</p>
              ) : (
                <p className="text-xs font-bold text-white leading-tight text-center">
                  {data.wasConverted ? "≈" : ""}{shortAmount(Math.round(data.total), targetCurrency)}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Year progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] text-gray-500">Year progress</p>
            <p className="text-[10px] font-semibold text-gray-400">
              Month {forecastTotals.currentMonth} / 12
            </p>
          </div>
          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all"
              style={{ width: `${forecastTotals.yearProgress * 100}%` }}
            />
          </div>
          <p className="mt-1 text-right text-[9px] text-gray-600">
            {Math.round(forecastTotals.yearProgress * 100)}% of year elapsed
          </p>
        </div>
      </div>
    </div>
  );
}
