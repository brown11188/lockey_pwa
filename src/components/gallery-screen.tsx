"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Settings as SettingsIcon, Image as ImageIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { formatDateGroup, getDateOnly } from "@/lib/format";
import { GalleryDayGroups, type EntryGroup } from "@/components/gallery-day-groups";
import { EntryDetailModal } from "@/components/entry-detail-modal";
import { DeleteEntryDialog } from "@/components/delete-entry-dialog";
import { HistoryCalendarPanel } from "@/components/history-calendar-panel";
import { DayDetailModal } from "@/components/day-detail-modal";
import { FabButton } from "@/components/fab-button";
import { QuickAddModal } from "@/components/quick-add-modal";
import { StreakBadge } from "@/components/streak-badge";
import { MonthlyWrapped, type WrappedData } from "@/components/monthly-wrapped";
import type { Entry } from "@/db/schema";

type Filter = "week" | "month" | "all";

interface GalleryScreenProps {
  initialEntries?: Entry[];
  initialStreak?: number;
}

export function GalleryScreen({ initialEntries, initialStreak }: GalleryScreenProps = {}) {
  const { t } = useLanguage();
  const [entries, setEntries] = useState<Entry[]>(initialEntries ?? []);
  const [filter, setFilter] = useState<Filter>("all");
  // If server prefetched entries, start without loading spinner
  const [loading, setLoading] = useState(!initialEntries);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Entry | null>(null);
  const [selectedDate, setSelectedDate] = useState(getDateOnly(new Date().toISOString()));
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState<string | undefined>(undefined);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(initialStreak ?? 0);
  const [wrappedData, setWrappedData] = useState<WrappedData | null>(null);
  const [showWrapped, setShowWrapped] = useState(false);
  // Track whether we should skip the first "all" fetch (already have server data)
  const skipInitialFetch = useRef(!!initialEntries);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/entries?filter=${filter}`);
      setEntries((await response.json()) as Entry[]);
    } catch {
      console.error("Failed to fetch entries");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    // Skip initial fetch for "all" filter when server already provided data (Fix #7)
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    fetchEntries();
  }, [fetchEntries]);

  // Fetch streak + wrapped in parallel on mount (Fix #5)
  useEffect(() => {
    Promise.all([
      apiFetch("/api/streak").then((res) => res.ok ? res.json() : null).catch(() => null),
      apiFetch("/api/wrapped").then((res) => res.ok ? res.json() : null).catch(() => null),
    ]).then(([streakData, wrappedResult]) => {
      if (streakData) setCurrentStreak(streakData.currentStreak ?? 0);
      if (wrappedResult?.hasData && !wrappedResult.dismissed) {
        const now = new Date();
        setWrappedData(wrappedResult);
        if (now.getDate() <= 3) setShowWrapped(true);
      } else if (wrappedResult?.hasData) {
        setWrappedData(wrappedResult);
      }
    });
  }, []);

  const handleDelete = useCallback(async (entry: Entry) => {
    try {
      await apiFetch(`/api/entries/${entry.id}`, { method: "DELETE" });
      setEntries((current) => current.filter((item) => item.id !== entry.id));
      setDeleteConfirm(null);
      setSelectedEntry(null);
    } catch {
      console.error("Failed to delete");
    }
  }, []);

  const groupedEntries = useMemo<EntryGroup[]>(() => {
    return entries.reduce<EntryGroup[]>((groups, entry) => {
      const date = getDateOnly(entry.createdAt);
      const existing = groups.find((group) => group.date === date);
      if (existing) {
        existing.entries.push(entry);
        existing.total += entry.amount;
        return groups;
      }

      groups.push({
        date,
        label: formatDateGroup(entry.createdAt, t.dateTime),
        entries: [entry],
        total: entry.amount,
      });
      return groups;
    }, []);
  }, [entries, t.dateTime]);

  const markedDates = useMemo(() => new Set(entries.map((entry) => getDateOnly(entry.createdAt))), [entries]);
  const selectedEntries = useMemo(
    () => entries.filter((entry) => getDateOnly(entry.createdAt) === selectedDate),
    [entries, selectedDate]
  );

  const handleDateSelect = useCallback((dateKey: string) => {
    setSelectedDate(dateKey);
    const hasEntries = entries.some((e) => getDateOnly(e.createdAt) === dateKey);
    if (!hasEntries) {
      setQuickAddDate(dateKey);
      setQuickAddOpen(true);
    } else {
      setDayDetailOpen(true);
    }
  }, [entries]);

  const handleQuickAddSaved = useCallback(() => {
    setQuickAddOpen(false);
    setQuickAddDate(undefined);
    // Parallelize entries + streak refresh (Fix #5)
    Promise.all([
      fetchEntries(),
      apiFetch("/api/streak")
        .then((res) => res.ok ? res.json() : null)
        .then((data) => { if (data) setCurrentStreak(data.currentStreak ?? 0); })
        .catch(() => {}),
    ]);
  }, [fetchEntries]);

  const handleDismissWrapped = useCallback(() => {
    setShowWrapped(false);
    if (wrappedData?.monthKey) {
      apiFetch("/api/wrapped", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthKey: wrappedData.monthKey }),
      }).catch(() => {});
    }
  }, [wrappedData]);

  const handleDayDetailSelectEntry = useCallback((entry: Entry) => {
    setSelectedEntry(entry);
    setDayDetailOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="sticky top-0 z-20 border-b border-white/5 bg-gray-950/95 backdrop-blur-lg safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">{t.gallery.title}</h1>
            <StreakBadge currentStreak={currentStreak} />
          </div>
          <Link href="/settings" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white">
            <SettingsIcon className="h-4 w-4" />
          </Link>
        </div>
        <div className="flex gap-2 px-4 pb-3">
          {(["week", "month", "all"] as Filter[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                filter === value ? "bg-amber-500 text-gray-950" : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {t.gallery[value]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
        </div>
      ) : filter === "all" ? (
        <div className="space-y-6 px-4 pt-4">
          <HistoryCalendarPanel
            selectedDate={selectedDate}
            markedDates={markedDates}
            allEntries={entries}
            onSelectDate={handleDateSelect}
          />

          <section>
            <h2 className="mb-3 text-sm font-semibold text-gray-400">{t.gallery.title}</h2>
            {groupedEntries.length > 0 ? (
              <GalleryDayGroups
                groups={groupedEntries}
                onSelectEntry={setSelectedEntry}
                onDeleteEntry={setDeleteConfirm}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                  <ImageIcon className="h-8 w-8 text-gray-600" />
                </div>
                <p className="mt-4 text-lg font-medium text-gray-300">{t.gallery.noEntries}</p>
                <p className="mt-2 text-sm text-gray-500">{t.gallery.noEntriesHint}</p>
              </div>
            )}
          </section>
        </div>
      ) : entries.length > 0 ? (
        <div className="px-4 pt-4">
          <GalleryDayGroups
            groups={groupedEntries}
            stickyHeader
            onSelectEntry={setSelectedEntry}
            onDeleteEntry={setDeleteConfirm}
          />
        </div>
      ) : (
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3 px-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <ImageIcon className="h-8 w-8 text-gray-600" />
          </div>
          <p className="text-lg font-medium text-gray-400">{t.gallery.noEntries}</p>
          <p className="text-sm text-gray-600">{t.gallery.noEntriesHint}</p>
        </div>
      )}

      {/* FAB */}
      <FabButton onQuickAdd={() => setQuickAddOpen(true)} />

      {/* Quick-Add Modal */}
      <QuickAddModal
        open={quickAddOpen}
        onClose={() => { setQuickAddOpen(false); setQuickAddDate(undefined); }}
        onSaved={handleQuickAddSaved}
        initialDate={quickAddDate}
      />

      {selectedEntry ? <EntryDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} onDelete={setDeleteConfirm} /> : null}
      {deleteConfirm ? <DeleteEntryDialog entry={deleteConfirm} onCancel={() => setDeleteConfirm(null)} onConfirm={handleDelete} /> : null}

      <DayDetailModal
        open={dayDetailOpen}
        onClose={() => setDayDetailOpen(false)}
        selectedDate={selectedDate}
        selectedEntries={selectedEntries}
        onSelectEntry={handleDayDetailSelectEntry}
        onDeleteEntry={setDeleteConfirm}
      />

      {/* Monthly Wrapped */}
      {showWrapped && wrappedData && wrappedData.hasData && (
        <MonthlyWrapped
          data={wrappedData}
          onDismiss={handleDismissWrapped}
        />
      )}
    </div>
  );
}
