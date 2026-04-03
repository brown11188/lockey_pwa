"use client";

import { useState } from "react";
import { X as XIcon, RefreshCw, Crown, LogOut, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Family, FamilyMember } from "@/db/schema";

interface MemberWithUser extends FamilyMember {
  name: string | null;
  email: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  family: Family;
  members: MemberWithUser[];
  currentUserId: string;
  onUpdated: () => void;
}

export function FamilySettingsModal({ open, onClose, family, members, currentUserId, onUpdated }: Props) {
  const [name, setName] = useState(family.name);
  const [budget, setBudget] = useState(family.monthlyBudget != null ? String(family.monthlyBudget) : "");
  const [budgetCurrency, setBudgetCurrency] = useState(family.budgetCurrency);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!open) return null;

  const isOwner = members.find((m) => m.userId === currentUserId)?.role === "owner";
  const otherMembers = members.filter((m) => m.userId !== currentUserId);

  async function handleSave() {
    setLoading(true); setError("");
    try {
      const res = await apiFetch("/api/family", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, monthlyBudget: budget || null, budgetCurrency }),
      });
      if (!res.ok) { setError("Failed to save"); return; }
      onUpdated();
      onClose();
    } finally { setLoading(false); }
  }

  async function handleRefreshCode() {
    setLoading(true);
    try {
      const res = await apiFetch("/api/family/invite/refresh", { method: "POST" });
      if (res.ok) { onUpdated(); onClose(); }
    } finally { setLoading(false); }
  }

  async function handleTransfer() {
    if (!transferTo) return;
    setLoading(true); setError("");
    try {
      const res = await apiFetch("/api/family/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: transferTo }),
      });
      if (!res.ok) { setError("Failed to transfer"); return; }
      onUpdated(); onClose();
    } finally { setLoading(false); }
  }

  async function handleRemove(userId: string) {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/family/members/${userId}`, { method: "DELETE" });
      if (res.ok) onUpdated();
    } finally { setLoading(false); }
  }

  async function handleDeleteFamily() {
    setLoading(true);
    try {
      const res = await apiFetch("/api/family", { method: "DELETE" });
      if (res.ok) { onUpdated(); onClose(); }
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl bg-gray-900 pb-10">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-gray-900 px-5 py-4">
          <h2 className="text-lg font-bold text-white">Family Settings</h2>
          <button type="button" onClick={onClose} className="rounded-full bg-white/5 p-2 text-gray-400 hover:text-white">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 px-5">
          {error && <p className="text-sm text-red-400 rounded-lg bg-red-400/10 px-3 py-2">{error}</p>}

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-400">Family name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-500/50 focus:outline-none"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-400">Family monthly budget (optional)</label>
            <div className="flex gap-2">
              <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5">
                {(["VND", "USD"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBudgetCurrency(c)}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${budgetCurrency === c ? "bg-amber-500 text-gray-950" : "text-gray-400"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="No limit"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-600 focus:border-amber-500/50 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading || !name.trim()}
            className="w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-gray-950 disabled:opacity-40"
          >
            Save Changes
          </button>

          {/* Invite code refresh */}
          <div className="rounded-xl border border-white/5 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Invite code</p>
                <p className="font-mono text-lg font-bold text-amber-400 tracking-widest">{family.inviteCode}</p>
              </div>
              <button type="button" onClick={handleRefreshCode} disabled={loading} className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs text-gray-400 hover:text-white">
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
          </div>

          {/* Members */}
          {otherMembers.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-400">Members</p>
              <div className="space-y-2">
                {otherMembers.map((m) => (
                  <div key={m.userId} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{m.name ?? m.email}</p>
                      <p className="text-xs text-gray-500">{m.role}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(m.userId)}
                      disabled={loading}
                      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transfer ownership */}
          {otherMembers.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-400">Transfer ownership</p>
              <div className="flex gap-2">
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:outline-none [color-scheme:dark]"
                >
                  <option value="">Select member…</option>
                  {otherMembers.map((m) => (
                    <option key={m.userId} value={m.userId}>{m.name ?? m.email}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleTransfer}
                  disabled={!transferTo || loading}
                  className="flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white disabled:opacity-40"
                >
                  <Crown className="h-4 w-4 text-amber-400" />
                  Transfer
                </button>
              </div>
            </div>
          )}

          {/* Delete family */}
          <div className="border-t border-white/5 pt-4">
            {confirmDelete ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 space-y-3">
                <p className="text-sm text-red-300">Delete family? All members will be removed. This cannot be undone.</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setConfirmDelete(false)} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-gray-400">
                    Cancel
                  </button>
                  <button type="button" onClick={handleDeleteFamily} disabled={loading} className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-bold text-white disabled:opacity-40">
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete Family
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
