"use client";

import { CategoryBadge } from "@/components/category-badge";
import { getEntryPhotoUrl } from "@/lib/entry-photo";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency-context";
import { useLanguage } from "@/lib/language-context";
import { getCategoryInfo } from "@/lib/constants";
import type { Entry } from "@/db/schema";
import { Trash2 as Trash2Icon, X as XIcon } from "lucide-react";

interface EntryDetailModalProps {
  entry: Entry;
  onClose: () => void;
  onDelete: (entry: Entry) => void;
}

export function EntryDetailModal({ entry, onClose, onDelete }: EntryDetailModalProps) {
  const { currency } = useCurrency();
  const { t } = useLanguage();
  const photoUrl = getEntryPhotoUrl(entry);
  const catInfo = getCategoryInfo(entry.category);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-gray-900">
        <div className="relative">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={entry.note || "Expense"}
              className="w-full rounded-t-3xl object-cover"
              style={{ maxHeight: "50vh" }}
            />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-t-3xl bg-gradient-to-br from-gray-800/80 to-gray-950">
              <span className="text-6xl">{catInfo.emoji}</span>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-amber-400">
              {formatCurrency(entry.amount, currency)}
            </span>
            <CategoryBadge category={entry.category} />
          </div>
          {entry.note ? <p className="mt-3 text-gray-300">{entry.note}</p> : null}
          <p className="mt-2 text-sm text-gray-500">{new Date(entry.createdAt).toLocaleString()}</p>
          <button
            type="button"
            onClick={() => onDelete(entry)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 py-3 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20"
          >
            <Trash2Icon className="h-4 w-4" />
            {t.gallery.deleteEntry}
          </button>
        </div>
      </div>
    </div>
  );
}
