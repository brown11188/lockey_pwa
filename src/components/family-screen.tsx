"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users as UsersIcon,
  Copy,
  Settings as SettingsIcon,
  Lock,
  Eye,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useSession } from "next-auth/react";
import { formatCurrency } from "@/lib/format";
import { FamilyCreateModal } from "@/components/family-create-modal";
import { FamilyJoinModal } from "@/components/family-join-modal";
import { FamilySettingsModal } from "@/components/family-settings-modal";
import { FamilyMemberDetail } from "@/components/family-member-detail";
import type { Family, FamilyMember } from "@/db/schema";

interface MemberWithUser extends FamilyMember {
  name: string | null;
  email: string;
  image: string | null;
}

interface FamilyStats {
  thisMonth: number;
  sharedSubsMonthly: number;
  currency: string;
  budget: number | null;
  participatingMembers: number;
}

function MemberAvatar({ name, image }: { name: string | null; image: string | null }) {
  const initials = (name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (image) {
    return <img src={image} alt={name ?? ""} className="h-10 w-10 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-amber-400">
      {initials}
    </div>
  );
}

export function FamilyScreen() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? "";

  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [stats, setStats] = useState<FamilyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detailMember, setDetailMember] = useState<MemberWithUser | null>(null);
  const [copied, setCopied] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(false);

  const fetchFamily = useCallback(async () => {
    try {
      const res = await apiFetch("/api/family");
      if (!res.ok) { setFamily(null); setMembers([]); return; }
      const data = await res.json();
      if (!data) { setFamily(null); setMembers([]); return; }
      setFamily(data.family);
      setMembers(data.members);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    const res = await apiFetch("/api/family/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  useEffect(() => {
    fetchFamily();
  }, [fetchFamily]);

  useEffect(() => {
    if (family) fetchStats();
  }, [family, fetchStats]);

  function copyCode() {
    if (!family) return;
    navigator.clipboard.writeText(family.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLeave() {
    if (!confirm("Leave this family?")) return;
    const res = await apiFetch("/api/family/leave", { method: "POST" });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error ?? "Failed to leave");
      return;
    }
    fetchFamily();
  }

  async function togglePrivacy() {
    const me = members.find((m) => m.userId === currentUserId);
    if (!me) return;
    setPrivacyLoading(true);
    try {
      await apiFetch(`/api/family/members/${currentUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrivate: !me.isPrivate }),
      });
      fetchFamily();
    } finally {
      setPrivacyLoading(false);
    }
  }

  const me = members.find((m) => m.userId === currentUserId);
  const isOwner = me?.role === "owner";
  const otherMembers = members.filter((m) => m.userId !== currentUserId);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  // Detail view
  if (detailMember) {
    return (
      <FamilyMemberDetail
        userId={detailMember.userId}
        memberName={detailMember.name ?? detailMember.email}
        onBack={() => setDetailMember(null)}
      />
    );
  }

  // Not in a family
  if (!family) {
    return (
      <div className="min-h-screen bg-gray-950 pb-24">
        <div className="sticky top-0 z-20 border-b border-white/5 bg-gray-950/95 backdrop-blur-lg safe-top">
          <div className="px-4 py-3">
            <h1 className="text-xl font-bold text-white">Family</h1>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 px-8 pt-20 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/10">
            <UsersIcon className="h-12 w-12 text-amber-400/60" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Track together</h2>
            <p className="mt-2 text-sm text-gray-500">
              Create or join a family to view each other's expenses and subscriptions.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="w-full rounded-2xl bg-amber-500 py-4 text-sm font-bold text-gray-950 transition-all hover:bg-amber-400"
            >
              + Create a Family
            </button>
            <button
              type="button"
              onClick={() => setJoinOpen(true)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 text-sm font-medium text-white transition-all hover:bg-white/10"
            >
              # Join with Code
            </button>
          </div>
        </div>

        <FamilyCreateModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={fetchFamily} />
        <FamilyJoinModal open={joinOpen} onClose={() => setJoinOpen(false)} onJoined={fetchFamily} />
      </div>
    );
  }

  // Dashboard
  const budgetPct = stats && stats.budget ? Math.min((stats.thisMonth / stats.budget) * 100, 100) : null;

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/5 bg-gray-950/95 backdrop-blur-lg safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-bold text-white">{family.name}</h1>
            <p className="text-xs text-gray-500">{members.length} / 6 members</p>
          </div>
          {isOwner && (
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white"
            >
              <SettingsIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Family spending summary */}
        {stats && (
          <div className="rounded-2xl border border-white/5 bg-gray-900/60 p-5 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-3">
              This Month · Family Total
            </p>
            <p className="text-3xl font-bold text-white">
              {formatCurrency(stats.thisMonth, stats.currency)}
            </p>
            {stats.budget ? (
              <>
                <div className="mt-3 h-2 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      budgetPct && budgetPct >= 100
                        ? "bg-red-500"
                        : budgetPct && budgetPct >= 80
                        ? "bg-amber-500"
                        : "bg-gradient-to-r from-amber-500 to-amber-400"
                    }`}
                    style={{ width: `${budgetPct ?? 0}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  {formatCurrency(stats.thisMonth, stats.currency)} of {formatCurrency(stats.budget, stats.currency)} budget
                  {budgetPct != null && ` · ${Math.round(budgetPct)}%`}
                </p>
              </>
            ) : null}
          </div>
        )}

        {/* Members */}
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Members</p>
          <div className="space-y-2">
            {members.map((m) => {
              const isSelf = m.userId === currentUserId;
              return (
                <button
                  key={m.userId}
                  type="button"
                  disabled={m.isPrivate && !isSelf}
                  onClick={() => !m.isPrivate || isSelf ? setDetailMember(m) : undefined}
                  className="flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-left transition-all hover:bg-white/8 disabled:opacity-60 disabled:cursor-default"
                >
                  <MemberAvatar name={m.name} image={m.image} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">
                        {m.name ?? m.email}{isSelf ? " (you)" : ""}
                      </span>
                      {m.role === "owner" && (
                        <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                          Owner
                        </span>
                      )}
                    </div>
                    {m.isPrivate ? (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Lock className="h-3 w-3" /> Private
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">Tap to view activity</span>
                    )}
                  </div>
                  {!m.isPrivate && <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Shared subscriptions */}
        {stats && stats.sharedSubsMonthly > 0 && (
          <div className="rounded-2xl border border-white/5 bg-gray-900/60 p-4 backdrop-blur-sm">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1">
              Shared Subscriptions
            </p>
            <p className="text-sm text-gray-400">
              Combined monthly: <span className="font-bold text-white">{formatCurrency(stats.sharedSubsMonthly, stats.currency)}</span>
            </p>
          </div>
        )}

        {/* Invite code */}
        <div className="rounded-2xl border border-white/5 bg-gray-900/60 p-4 backdrop-blur-sm">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">Invite Code</p>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xl font-bold tracking-widest text-amber-400">
              {family.inviteCode}
            </span>
            <button
              type="button"
              onClick={copyCode}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* My privacy + leave */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={togglePrivacy}
            disabled={privacyLoading}
            className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3"
          >
            <div className="flex items-center gap-2 text-sm text-gray-300">
              {me?.isPrivate ? <Lock className="h-4 w-4 text-amber-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              {me?.isPrivate ? "Your data is private" : "Your data is visible to family"}
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${me?.isPrivate ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-gray-400"}`}>
              {me?.isPrivate ? "Private" : "Visible"}
            </span>
          </button>

          {!isOwner && (
            <button
              type="button"
              onClick={handleLeave}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 py-3 text-sm text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Leave Family
            </button>
          )}
        </div>
      </div>

      {family && (
        <FamilySettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          family={family}
          members={members}
          currentUserId={currentUserId}
          onUpdated={() => { fetchFamily(); fetchStats(); setSettingsOpen(false); }}
        />
      )}
    </div>
  );
}
