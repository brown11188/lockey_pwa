export function GallerySkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 pb-24 animate-pulse">
      <div className="sticky top-0 z-20 border-b border-white/5 bg-gray-950/95 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-6 w-20 rounded bg-white/10" />
            <div className="h-6 w-12 rounded-full bg-white/5" />
          </div>
          <div className="h-9 w-9 rounded-full bg-white/5" />
        </div>
        <div className="px-4 pb-3">
          <div className="h-10 rounded-xl bg-white/5" />
        </div>
        <div className="flex gap-2 px-4 pb-3">
          <div className="h-8 w-16 rounded-full bg-white/10" />
          <div className="h-8 w-16 rounded-full bg-white/5" />
          <div className="h-8 w-20 rounded-full bg-white/5" />
        </div>
      </div>
      <div className="space-y-6 px-4 pt-4">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <div className="h-5 w-32 rounded bg-white/10 mb-4" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square rounded bg-white/5" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 pb-24 animate-pulse">
      <div className="sticky top-0 z-20 border-b border-white/5 bg-gray-950/95 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="h-6 w-16 rounded bg-white/10" />
          <div className="h-9 w-9 rounded-full bg-white/5" />
        </div>
        <div className="flex gap-2 px-4 pb-3">
          <div className="h-8 w-20 rounded-full bg-white/10" />
          <div className="h-8 w-20 rounded-full bg-white/5" />
        </div>
      </div>
      <div className="space-y-4 px-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-2xl bg-white/5" />
          <div className="h-24 rounded-2xl bg-white/5" />
        </div>
        <div className="h-48 rounded-2xl bg-white/5" />
        <div className="h-40 rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}

export function SubscriptionsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 pb-24 animate-pulse">
      <div className="sticky top-0 z-20 border-b border-white/5 bg-gray-950/95 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="h-6 w-28 rounded bg-white/10" />
          <div className="h-9 w-16 rounded-full bg-white/5" />
        </div>
      </div>
      <div className="space-y-4 px-4 pt-4">
        <div className="h-32 rounded-2xl bg-white/5" />
        <div className="h-20 rounded-2xl bg-white/5" />
        <div className="h-20 rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}

export function FamilySkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 pb-24 animate-pulse">
      <div className="sticky top-0 z-20 border-b border-white/5 bg-gray-950/95 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="h-6 w-20 rounded bg-white/10" />
          <div className="h-9 w-9 rounded-full bg-white/5" />
        </div>
      </div>
      <div className="space-y-4 px-4 pt-4">
        <div className="h-40 rounded-2xl bg-white/5" />
        <div className="h-24 rounded-2xl bg-white/5" />
        <div className="h-24 rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}

export function CameraSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="h-12 w-12 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 pb-24 animate-pulse">
      <div className="sticky top-0 z-20 border-b border-white/5 bg-gray-950/95 safe-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="h-9 w-9 rounded-full bg-white/5" />
          <div className="h-6 w-20 rounded bg-white/10" />
        </div>
      </div>
      <div className="space-y-4 px-4 pt-4">
        <div className="h-20 rounded-2xl bg-white/5" />
        <div className="h-16 rounded-2xl bg-white/5" />
        <div className="h-16 rounded-2xl bg-white/5" />
        <div className="h-16 rounded-2xl bg-white/5" />
        <div className="h-16 rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}
