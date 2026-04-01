"use client";

import { useLanguage } from "@/lib/language-context";
import type { Entry } from "@/db/schema";

interface DeleteEntryDialogProps {
  entry: Entry;
  onCancel: () => void;
  onConfirm: (entry: Entry) => void;
}

export function DeleteEntryDialog({ entry, onCancel, onConfirm }: DeleteEntryDialogProps) {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-gray-900 p-6">
        <h3 className="text-lg font-bold text-white">{t.gallery.deleteConfirmTitle}</h3>
        <p className="mt-2 text-sm text-gray-400">{t.gallery.deleteConfirmDesc}</p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-gray-400 hover:bg-white/5"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(entry)}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-400"
          >
            {t.common.delete}
          </button>
        </div>
      </div>
    </div>
  );
}
