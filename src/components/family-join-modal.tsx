"use client";

import { useState } from "react";
import { X as XIcon, Hash as HashIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onJoined: () => void;
}

export function FamilyJoinModal({ open, onClose, onJoined }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleJoin() {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/family/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code.trim().toUpperCase() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to join");
        return;
      }
      setCode("");
      onJoined();
      onClose();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-t-3xl bg-gray-900 p-6 pb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <HashIcon className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Join a Family</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-white/5 p-2 text-gray-400 hover:text-white">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-400">Invite code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. XK4P2WNB"
              maxLength={8}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center font-mono text-xl font-bold tracking-widest text-amber-400 placeholder:text-gray-600 focus:border-amber-500/50 focus:outline-none uppercase"
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <p className="text-xs text-gray-600">Ask your family owner for their 8-character invite code.</p>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-gray-300">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleJoin}
              disabled={code.length < 8 || loading}
              className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-bold text-gray-950 disabled:opacity-40"
            >
              {loading ? "Joining…" : "Join Family"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
