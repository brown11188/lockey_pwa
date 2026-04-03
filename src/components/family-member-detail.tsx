"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, CreditCard } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Entry, Subscription } from "@/db/schema";

interface Props {
  userId: string;
  memberName: string;
  onBack: () => void;
}

export function FamilyMemberDetail({ userId, memberName, onBack }: Props) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch(`/api/family/members/${userId}/entries`).then((r) => r.ok ? r.json() : []),
      apiFetch(`/api/family/members/${userId}/subscriptions`).then((r) => r.ok ? r.json() : []),
    ]).then(([e, s]) => {
      setEntries(e);
      setSubs(s);
    }).finally(() => setLoading(false));
  }, [userId]);

  const activeSubs = subs.filter((s) => s.isActive);

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/5 bg-gray-950/95 backdrop-blur-lg safe-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <button type="button" onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-lg font-bold text-white">{memberName}</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-6">
          {/* Subscriptions */}
          {activeSubs.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-400">
                <CreditCard className="h-4 w-4" />
                Subscriptions ({activeSubs.length})
              </h2>
              <div className="space-y-2">
                {activeSubs.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{s.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{s.cycle}</p>
                    </div>
                    <p className="text-sm font-bold text-amber-400">{formatCurrency(s.amount, s.currency)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent expenses */}
          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-400">
              Recent Expenses ({entries.length})
            </h2>
            {entries.length === 0 ? (
              <p className="text-sm text-gray-600">No expenses yet.</p>
            ) : (
              <div className="space-y-2">
                {entries.slice(0, 30).map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white capitalize">{e.category}</p>
                      {e.note ? <p className="text-xs text-gray-500 truncate max-w-[180px]">{e.note}</p> : null}
                      <p className="text-xs text-gray-600">{e.createdAt.slice(0, 10)}</p>
                    </div>
                    <p className="text-sm font-bold text-white">{formatCurrency(e.amount, e.currency)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
