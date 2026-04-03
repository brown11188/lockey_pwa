"use client";

import { useState } from "react";
import { X as XIcon, Users as UsersIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function FamilyCreateModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to create family");
        return;
      }
      setName("");
      onCreated();
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
            <UsersIcon className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Create a Family</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-white/5 p-2 text-gray-400 hover:text-white">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-400">Family name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. The Nguyen Family"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-600 focus:border-amber-500/50 focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <p className="text-xs text-gray-600">An invite code will be generated automatically. Share it with family members to invite them.</p>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-gray-300">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!name.trim() || loading}
              className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-bold text-gray-950 disabled:opacity-40"
            >
              {loading ? "Creating…" : "Create Family"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
