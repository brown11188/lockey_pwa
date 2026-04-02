"use client";

import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import { findKnownService } from "@/lib/known-services";
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

// ─── Custom tooltip ──────────────────────────────────────────────────────────

function BubbleTooltip({ active, payload }: { active?: boolean; payload?: { payload: BubbleDatum }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/95 p-3 text-xs shadow-2xl backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
        <span className="font-bold text-white">{d.name}</span>
      </div>
      <p className="text-gray-400 capitalize">{d.cycle} · renews day {d.x}</p>
      <p className="mt-1 font-semibold text-amber-400">
        {formatCurrency(Math.round(d.y), d.currency)}<span className="text-gray-500 font-normal">/mo</span>
      </p>
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Planet extends Subscription {
  monthly: number;
  orbitIdx: number;
  startAngle: number;
  radius: number;
  speed: string;
  size: number;
  color: string;
  logo: string;
}

interface BubbleDatum {
  x: number;
  y: number;
  z: number;
  name: string;
  color: string;
  cycle: string;
  amount: number;
  currency: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  subscriptions: Subscription[];
  currency?: string; // kept for legacy compat, totals are now per-subscription currency
}

export function SubscriptionOverview({ subscriptions }: Props) {
  const active = useMemo(() => subscriptions.filter((s) => s.isActive), [subscriptions]);

  const planets = useMemo<Planet[]>(() => {
    if (!active.length) return [];
    const sorted = [...active]
      .map((s) => ({ ...s, monthly: calcMonthly(s.amount, s.cycle) }))
      .sort((a, b) => b.monthly - a.monthly);
    const maxMonthly = Math.max(...sorted.map((s) => s.monthly));

    // bucket into 3 orbit rings by index mod 3
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
        size: 7 + (sub.monthly / maxMonthly) * 13,
        color: PALETTE[gi % PALETTE.length],
        logo,
      };
    });
  }, [active]);

  // Group monthly totals by currency (handle mixed VND/USD)
  const totalsByCurrency = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of active) {
      map[s.currency] = (map[s.currency] || 0) + calcMonthly(s.amount, s.cycle);
    }
    return Object.entries(map); // [[currency, total], ...]
  }, [active]);

  // Dominant currency = currency with most subscriptions (for chart axes)
  const dominantCurrency = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of active) counts[s.currency] = (counts[s.currency] || 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "VND";
  }, [active]);

  const bubbleData = useMemo<BubbleDatum[]>(
    () =>
      planets.map((p) => ({
        x: new Date(p.nextRenewalDate + "T00:00:00").getDate(),
        y: Math.round(p.monthly),
        z: Math.round(p.monthly),
        name: p.name,
        color: p.color,
        cycle: p.cycle,
        amount: p.amount,
        currency: p.currency,
      })),
    [planets]
  );

  if (!active.length) return null;

  return (
    <div className="space-y-4">
      {/* ── Orbit Chart ─────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-gray-900/60 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-1">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
              Subscription Orbits
            </p>
            <p className="mt-0.5 text-xs text-gray-600">Each planet = one subscription · size = monthly cost</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-lg font-bold text-white">{active.length}</p>
          </div>
        </div>

        <div className="flex flex-col items-center">
          {/* SVG orbit visualization */}
          <svg
            viewBox="0 0 280 280"
            className="w-full max-w-[300px]"
            style={{ overflow: "visible" }}
          >
            <defs>
              {/* Amber glow at center */}
              <radialGradient id="sub-center-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
              {/* Per-planet glow */}
              {planets.map((p) => (
                <radialGradient key={`rg-${p.id}`} id={`pg-${p.id}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={p.color} stopOpacity="0.7" />
                  <stop offset="100%" stopColor={p.color} stopOpacity="0" />
                </radialGradient>
              ))}
            </defs>

            {/* Center ambient glow */}
            <circle cx={C} cy={C} r="75" fill="url(#sub-center-glow)" />

            {/* Orbit ring tracks */}
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

            {/* Centre disc */}
            <circle
              cx={C}
              cy={C}
              r="38"
              fill="rgba(245,158,11,0.08)"
              stroke="rgba(245,158,11,0.2)"
              strokeWidth="1.5"
            />
            {totalsByCurrency.length === 1 ? (
              <>
                <text x={C} y={C - 7} textAnchor="middle" fill="white" fontSize="10" fontWeight="700">
                  {shortAmount(Math.round(totalsByCurrency[0][1]), totalsByCurrency[0][0])}
                </text>
                <text x={C} y={C + 8} textAnchor="middle" fill="rgba(156,163,175,0.8)" fontSize="7.5">
                  per month
                </text>
              </>
            ) : (
              <>
                {totalsByCurrency.map(([cur, total], i) => (
                  <text
                    key={cur}
                    x={C}
                    y={C - 11 + i * 13}
                    textAnchor="middle"
                    fill={i === 0 ? "white" : "rgba(251,191,36,0.9)"}
                    fontSize="9"
                    fontWeight="700"
                  >
                    {shortAmount(Math.round(total), cur)}
                  </text>
                ))}
                <text x={C} y={C + 16} textAnchor="middle" fill="rgba(156,163,175,0.8)" fontSize="7">
                  per month
                </text>
              </>
            )}

            {/* Orbiting planets */}
            {planets.map((p) => (
              <g key={p.id}>
                {/* Glow halo */}
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
                {/* Planet body */}
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
      </div>

      {/* ── Bubble Chart ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/5 bg-gray-900/60 p-5 backdrop-blur-sm">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
          Renewal Timeline
        </p>
        <p className="mt-0.5 mb-4 text-xs text-gray-600">
          X = renewal day of month · Y = monthly cost · bubble size = cost
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart margin={{ top: 10, right: 16, bottom: 20, left: 4 }}>
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, 32]}
              ticks={[1, 7, 14, 21, 28, 31]}
              tick={{ fill: "rgba(156,163,175,0.7)", fontSize: 10 }}
              axisLine={{ stroke: "rgba(255,255,255,0.05)" }}
              tickLine={false}
              label={{
                value: "Day of month",
                position: "insideBottom",
                offset: -10,
                fill: "rgba(107,114,128,0.7)",
                fontSize: 10,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              tick={{ fill: "rgba(156,163,175,0.7)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={64}
              tickFormatter={(v) => shortAmount(v, dominantCurrency)}
            />
            <ZAxis type="number" dataKey="z" range={[120, 900]} />
            <Tooltip
              cursor={false}
              content={(props) => (
                <BubbleTooltip
                  active={props.active}
                  payload={props.payload as unknown as { payload: BubbleDatum }[] | undefined}
                />
              )}
            />
            <Scatter data={bubbleData} fillOpacity={0.82}>
              {bubbleData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.color}
                  stroke={entry.color}
                  strokeOpacity={0.4}
                  strokeWidth={2}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
