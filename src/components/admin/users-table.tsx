"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, Loader2, Users, RefreshCw } from "lucide-react";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  entryCount: number;
  subscriptionCount: number;
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-mono font-semibold tracking-wider uppercase"
      style={
        role === "admin"
          ? { background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }
          : { background: "rgba(75,85,99,0.3)", color: "#6b7280", border: "1px solid rgba(75,85,99,0.4)" }
      }
    >
      {role}
    </span>
  );
}

function Initials({ name, email }: { name: string | null; email: string }) {
  const text = name ?? email;
  const chars = text
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-gray-950"
      style={{ background: "#f59e0b" }}
    >
      {chars}
    </div>
  );
}

export function UsersTable() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.email.toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="p-8" style={{ fontFamily: "'DM Sans', 'Geist', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "#f5f5f5", letterSpacing: "-0.02em" }}
          >
            Users
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {users.length} total account{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs text-gray-400 transition-colors hover:text-gray-200"
          style={{ borderColor: "rgba(75,85,99,0.4)", background: "rgba(17,17,17,0.8)" }}
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "Total Users", value: users.length },
          { label: "Admins", value: users.filter((u) => u.role === "admin").length },
          { label: "Regular Users", value: users.filter((u) => u.role === "user").length },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border px-4 py-3"
            style={{ background: "#111", borderColor: "rgba(245,158,11,0.08)" }}
          >
            <div className="font-mono text-xl font-bold text-white">{s.value}</div>
            <div className="mt-0.5 text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex flex-1 items-center gap-2 rounded-lg border px-3 py-2"
          style={{ background: "#111", borderColor: "rgba(75,85,99,0.3)" }}
        >
          <Search size={14} className="text-gray-500 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as "all" | "user" | "admin")}
          className="rounded-lg border px-3 py-2 text-sm text-gray-300 outline-none"
          style={{ background: "#111", borderColor: "rgba(75,85,99,0.3)" }}
        >
          <option value="all">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border" style={{ borderColor: "rgba(245,158,11,0.1)" }}>
        {/* Header row */}
        <div
          className="grid grid-cols-[auto_1fr_auto_auto_auto_32px] gap-4 px-4 py-2.5 text-[10px] font-mono tracking-[0.15em] text-gray-600 uppercase border-b"
          style={{ background: "#0d0d0d", borderColor: "rgba(245,158,11,0.08)" }}
        >
          <span className="w-8" />
          <span>User</span>
          <span>Role</span>
          <span className="text-right">Entries</span>
          <span className="text-right">Subs</span>
          <span />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20" style={{ background: "#111" }}>
            <Loader2 size={20} className="animate-spin text-amber-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20" style={{ background: "#111" }}>
            <Users size={32} className="text-gray-700" />
            <p className="text-sm text-gray-500">No users found</p>
          </div>
        ) : (
          <div style={{ background: "#111" }}>
            {filtered.map((user, i) => (
              <button
                key={user.id}
                onClick={() => router.push(`/admin/users/${user.id}`)}
                className="grid w-full grid-cols-[auto_1fr_auto_auto_auto_32px] gap-4 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.03] border-b last:border-b-0 items-center"
                style={{ borderColor: "rgba(255,255,255,0.04)" }}
              >
                <Initials name={user.name} email={user.email} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-gray-200">
                    {user.name ?? <span className="text-gray-500 italic">No name</span>}
                  </div>
                  <div className="truncate text-xs text-gray-500 font-mono">{user.email}</div>
                </div>
                <RoleBadge role={user.role} />
                <div className="text-right font-mono text-sm text-gray-400">{user.entryCount}</div>
                <div className="text-right font-mono text-sm text-gray-400">{user.subscriptionCount}</div>
                <ChevronRight size={14} className="text-gray-600" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
