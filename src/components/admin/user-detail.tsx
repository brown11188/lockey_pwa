"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { RoleBadge } from "@/components/admin/role-badge";
import { UserInitials } from "@/components/admin/user-initials";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Receipt,
  CreditCard,
  Calendar,
  Mail,
  AlertTriangle,
} from "lucide-react";

type UserProfile = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
};

type Entry = {
  id: number;
  amount: number;
  currency: string;
  category: string;
  note: string;
  createdAt: string;
  photoUri: string | null;
};

type Subscription = {
  id: string;
  name: string;
  logoUrl: string | null;
  amount: number;
  currency: string;
  cycle: string;
  nextRenewalDate: string;
  isActive: boolean;
};

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency === "VND" ? "USD" : currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
  })
    .format(amount)
    .replace("$", currency === "VND" ? "₫" : "$");
}

export function UserDetail({ userId }: { userId: string }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [tab, setTab] = useState<"entries" | "subscriptions">("entries");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, entriesRes, subsRes] = await Promise.all([
        apiFetch(`/api/admin/users/${userId}`),
        apiFetch(`/api/admin/users/${userId}/entries`),
        apiFetch(`/api/admin/users/${userId}/subscriptions`),
      ]);
      if (userRes.ok) setUser(await userRes.json());
      if (entriesRes.ok) setEntries(await entriesRes.json());
      if (subsRes.ok) setSubscriptions(await subsRes.json());
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function toggleRole() {
    if (!user) return;
    const newRole = user.role === "admin" ? "user" : "admin";
    setUpdatingRole(true);
    try {
      const res = await apiFetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) setUser({ ...user, role: newRole });
    } finally {
      setUpdatingRole(false);
    }
  }

  async function deleteUser() {
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) router.push("/admin/users");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-amber-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 py-32 text-gray-500">
        <AlertTriangle size={32} />
        <p>User not found</p>
      </div>
    );
  }

  return (
    <div className="p-8" style={{ fontFamily: "'DM Sans', 'Geist', system-ui, sans-serif" }}>
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-300"
      >
        <ArrowLeft size={14} />
        Back to users
      </button>

      {/* Profile card */}
      <div
        className="mb-6 rounded-2xl border p-6"
        style={{ background: "#111", borderColor: "rgba(245,158,11,0.1)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <UserInitials name={user.name} email={user.email} size="lg" />
            <div>
              <h1
                className="text-xl font-bold tracking-tight text-gray-100"
                style={{ letterSpacing: "-0.02em" }}
              >
                {user.name ?? <span className="text-gray-500 italic font-normal">No name</span>}
              </h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <Mail size={12} />
                <span className="font-mono">{user.email}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <RoleBadge role={user.role} showIcon />
                <span className="flex items-center gap-1 text-[11px] text-gray-600 font-mono">
                  <Calendar size={10} />
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleRole}
              disabled={updatingRole}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:border-amber-400/40 hover:text-amber-400 disabled:opacity-50"
              style={{ borderColor: "rgba(75,85,99,0.4)", color: "#9ca3af", background: "#0d0d0d" }}
            >
              {updatingRole ? (
                <Loader2 size={12} className="animate-spin" />
              ) : user.role === "admin" ? (
                <ShieldOff size={12} />
              ) : (
                <ShieldCheck size={12} />
              )}
              {user.role === "admin" ? "Demote to user" : "Promote to admin"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:border-red-500/40 hover:text-red-400"
              style={{ borderColor: "rgba(75,85,99,0.4)", color: "#9ca3af", background: "#0d0d0d" }}
            >
              <Trash2 size={12} />
              Delete
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div>
            <div className="font-mono text-lg font-bold text-white">{entries.length}</div>
            <div className="text-xs text-gray-500">Expense entries</div>
          </div>
          <div>
            <div className="font-mono text-lg font-bold text-white">{subscriptions.length}</div>
            <div className="text-xs text-gray-500">Subscriptions</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="mb-4 flex rounded-xl border p-1"
        style={{ background: "#0d0d0d", borderColor: "rgba(245,158,11,0.1)" }}
      >
        {(["entries", "subscriptions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium capitalize transition-all"
            style={
              tab === t
                ? { background: "rgba(245,158,11,0.12)", color: "#f59e0b" }
                : { color: "#6b7280" }
            }
          >
            {t === "entries" ? <Receipt size={13} /> : <CreditCard size={13} />}
            {t === "entries" ? "Expenses" : "Subscriptions"}
          </button>
        ))}
      </div>

      {/* Entries tab */}
      {tab === "entries" && (
        <div className="overflow-hidden rounded-xl border" style={{ borderColor: "rgba(245,158,11,0.1)" }}>
          <div
            className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 text-[10px] font-mono tracking-[0.15em] text-gray-600 uppercase border-b"
            style={{ background: "#0d0d0d", borderColor: "rgba(245,158,11,0.08)" }}
          >
            <span>Category / Note</span>
            <span>Date</span>
            <span className="text-right">Amount</span>
            <span className="w-8 text-center">Photo</span>
          </div>
          <div style={{ background: "#111" }}>
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
                <Receipt size={28} className="text-gray-700" />
                <p className="text-sm">No expense entries</p>
              </div>
            ) : (
              entries.map((e) => (
                <div
                  key={e.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b px-4 py-3 last:border-b-0 items-center"
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}
                >
                  <div>
                    <div className="text-sm font-medium text-gray-200 capitalize">{e.category}</div>
                    {e.note && <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{e.note}</div>}
                  </div>
                  <div className="font-mono text-xs text-gray-500">
                    {new Date(e.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                  <div className="text-right font-mono text-sm font-semibold text-gray-200">
                    {e.amount.toLocaleString()} {e.currency}
                  </div>
                  <div className="w-8 text-center">
                    {e.photoUri ? (
                      <div
                        className="h-7 w-7 rounded overflow-hidden mx-auto"
                        style={{ background: "rgba(245,158,11,0.1)" }}
                      >
                        <img
                          src={e.photoUri}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(ev) => { (ev.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-700">—</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Subscriptions tab */}
      {tab === "subscriptions" && (
        <div className="overflow-hidden rounded-xl border" style={{ borderColor: "rgba(245,158,11,0.1)" }}>
          <div
            className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-2.5 text-[10px] font-mono tracking-[0.15em] text-gray-600 uppercase border-b"
            style={{ background: "#0d0d0d", borderColor: "rgba(245,158,11,0.08)" }}
          >
            <span className="w-7" />
            <span>Service</span>
            <span>Cycle</span>
            <span>Renewal</span>
            <span className="text-right">Amount</span>
          </div>
          <div style={{ background: "#111" }}>
            {subscriptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
                <CreditCard size={28} className="text-gray-700" />
                <p className="text-sm">No subscriptions</p>
              </div>
            ) : (
              subscriptions.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 border-b px-4 py-3 last:border-b-0 items-center"
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}
                >
                  <div className="h-7 w-7 flex items-center justify-center rounded-md overflow-hidden" style={{ background: "#1a1a1a" }}>
                    {s.logoUrl ? (
                      <img src={s.logoUrl} alt={s.name} className="h-5 w-5 object-contain" />
                    ) : (
                      <CreditCard size={12} className="text-gray-600" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-200">{s.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span
                        className="text-[9px] font-mono rounded px-1 py-px"
                        style={
                          s.isActive
                            ? { background: "rgba(34,197,94,0.1)", color: "#22c55e" }
                            : { background: "rgba(75,85,99,0.2)", color: "#6b7280" }
                        }
                      >
                        {s.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                  </div>
                  <div className="font-mono text-xs text-gray-500 capitalize">{s.cycle}</div>
                  <div className="font-mono text-xs text-gray-500">
                    {new Date(s.nextRenewalDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                  <div className="text-right font-mono text-sm font-semibold text-gray-200">
                    {s.amount.toLocaleString()} {s.currency}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div
            className="w-full max-w-sm rounded-2xl border p-6"
            style={{ background: "#111", borderColor: "rgba(239,68,68,0.2)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(239,68,68,0.1)" }}>
                <AlertTriangle size={18} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-100">Delete user?</h2>
                <p className="text-xs text-gray-500 font-mono">{user.email}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              This will permanently delete the user and all their data — expenses, subscriptions, photos, and settings. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl border py-2.5 text-sm text-gray-400 transition-colors hover:text-gray-200"
                style={{ borderColor: "rgba(75,85,99,0.4)", background: "#0d0d0d" }}
              >
                Cancel
              </button>
              <button
                onClick={deleteUser}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                style={{ background: "#dc2626" }}
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Delete user
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
