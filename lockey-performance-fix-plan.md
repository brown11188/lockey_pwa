# Lockey Performance Fix Plan

> Generated from live browser profiling on 2026-04-03. All timings are measured values.

## Context

The app uses Next.js (App Router / Turbopack), client-side data fetching via `apiFetch`, and a serverless DB backend (likely Neon/PlanetScale on Vercel). Every API endpoint with DB access has high TTFB (~350–1600ms), consistent with serverless cold-starts and no connection pooling.

---

## Fix #1 — Remove the 1,200ms hardcoded save delay 🔴

**File:** The capture/entry form component (contains `ei` submit handler)  
**Measured impact:** −1,200ms off every save  

**Current code (in `0gigto~n3y6h..js`, submit handler `ei`):**
```js
setTimeout(() => {
  s();   // navigate back
  en();  // reset form
}, 1200);
```

**Fix:** Remove the timeout and navigate immediately. Use a brief success animation/toast instead.
```js
// After successful save:
triggerHaptic();
setSuccess(true);
// Navigate immediately — don't wait 1200ms
s();
en();
```

If you need a visual "Saved!" moment, show a toast that auto-dismisses — don't block navigation on it.

---

## Fix #2 — Parallelize streak update + budget check after save 🔴

**File:** Capture/entry form submit handler (same `ei` function)  
**Measured impact:** −386ms off every save  

**Current code (sequential):**
```js
// Step 1: save entry
const r = await apiFetch('/api/entries', { method: 'POST', ... });

// Step 2: update streak (waits for entry ✓ — correct)
const streakRes = await apiFetch('/api/streak', { method: 'POST' });
if (streakRes.ok) { ... check milestone ... }

// Step 3: check budget (waits for streak — UNNECESSARY)
const budgetResult = await checkBudget(category);
```

**Fix:** Run streak and budget check in parallel — budget check only needs the category, not the streak result:
```js
// After entry is saved:
const [streakRes, budgetResult] = await Promise.all([
  apiFetch('/api/streak', { method: 'POST' }),
  checkBudget(category),
]);

if (streakRes.ok) {
  const streakData = await streakRes.json();
  if (streakData.milestone) showMilestone(streakData.milestone);
}

if (budgetResult.hasBudget && budgetResult.exceeded) {
  showBudgetAlert(...);
}
```

---

## Fix #3 — Add HTTP cache to `/api/wrapped` 🔴

**File:** `app/api/wrapped/route.ts` (or equivalent)  
**Measured impact:** −1,500ms off gallery load (currently the single biggest blocker)  
**Measured TTFB:** ~1,480–1,600ms on every request  

The wrapped endpoint computes monthly spending aggregates. It's re-computed on every GET even though the data changes at most once per entry save.

**Fix — Option A (quickest): Add stale-while-revalidate header**
```ts
// In GET handler:
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'private, max-age=0, stale-while-revalidate=300',
  },
});
```

**Fix — Option B (better): Cache result server-side**
```ts
// Simple in-memory cache keyed by userId + monthKey
const cache = new Map<string, { data: any; ts: number }>();
const TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(req: Request) {
  const userId = getUserId(req);
  const monthKey = getCurrentMonthKey();
  const cacheKey = `${userId}:${monthKey}`;
  
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json(cached.data);
  }
  
  const data = await computeWrapped(userId, monthKey);
  cache.set(cacheKey, { data, ts: Date.now() });
  return NextResponse.json(data);
}
```

**Fix — Option C (best for serverless):** Invalidate + recompute wrapped only when an entry is saved (POST /api/entries), store result in DB/KV.

---

## Fix #4 — Cache `/api/settings` with HTTP header 🟠

**File:** `app/api/settings/route.ts`  
**Measured impact:** −820ms off every page load (first call)  
**Measured TTFB:** ~820ms consistently (26 bytes response!)  

Settings only returns `{"onboarding_done":"true"}` — 26 bytes. It should not take 820ms.

**Fix:**
```ts
// GET /api/settings
return NextResponse.json(settings, {
  headers: {
    'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
  },
});
```

The client already has an in-memory cache (`fetchSettings()` deduplicates in-flight and caches result). Adding an HTTP cache header means even hard-refreshes will be fast via the browser cache.

Also ensure `settings` table has an index on `userId`:
```sql
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
```

---

## Fix #5 — Parallelize entries + streak refetch on gallery modal close 🟠

**File:** Gallery screen component — the `Y` callback (onClose after edit/delete)  
**Measured impact:** −410ms off post-edit gallery reload  

**Current code:**
```js
const Y = useCallback(() => {
  setClosed(true);
  setEditEntry(undefined);
  z();                            // awaits GET /api/entries (~870ms)
  apiFetch('/api/streak')...      // fires after, GET /api/streak (~410ms)
}, [z]);
```

**Fix:** Fire both in parallel:
```js
const Y = useCallback(async () => {
  setClosed(true);
  setEditEntry(undefined);
  await Promise.all([
    z(),                                       // GET /api/entries
    apiFetch('/api/streak')                    // GET /api/streak
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStreak(data.currentStreak ?? 0); })
      .catch(() => {}),
  ]);
}, [z]);
```

---

## Fix #6 — Investigate and optimize `/api/budgets` 🟠

**Measured TTFB:** ~2,100ms (worst single endpoint!)  
**File:** `app/api/budgets/route.ts`  

This endpoint returned an empty array `[]` in 2,105ms. An empty result taking 2 seconds means either:
- A missing index causing a full table scan
- An N+1 query pattern
- DB connection cold-start hit on this specific endpoint

**Fix:**
1. Add index: `CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);`
2. Cache the result: budgets change rarely (user manually sets them)
3. Add `Cache-Control: private, max-age=30, stale-while-revalidate=120`

---

## Fix #7 — Move gallery initial data to server-side rendering 🟡

**File:** Gallery page (`app/gallery/page.tsx` + screen component)  
**Measured impact:** Eliminates the 1,500–2,500ms waterfall entirely on first load  

**Current flow (client-side, 3 separate useEffects):**
```
Page loads → JS hydrates → 3 useEffects fire → 3 parallel fetches → UI renders
Total: ~1,500ms (blocked on slowest: /api/wrapped)
```

**Fix (Next.js App Router server component):**
```tsx
// app/gallery/page.tsx — runs on server, data arrives with HTML
export default async function GalleryPage() {
  const [entries, streak, wrapped] = await Promise.all([
    fetchEntries('all'),
    fetchStreak(),
    fetchWrapped(),
  ]);
  
  return <GalleryScreen initialEntries={entries} initialStreak={streak} initialWrapped={wrapped} />;
}
```

```tsx
// GalleryScreen becomes a client component that accepts initialData props
// and only re-fetches on user actions (save, delete, filter change)
'use client';
export function GalleryScreen({ initialEntries, initialStreak, initialWrapped }) {
  const [entries, setEntries] = useState(initialEntries);
  const [streak, setStreak] = useState(initialStreak?.currentStreak ?? 0);
  // ...
}
```

---

## Fix #8 — Deduplicate `/api/auth/session` double call 🟡

**Measured:** 2× `GET /api/auth/session` on every page load  
**Measured TTFB:** ~115ms each (fast, but unnecessary round trips)  

The session is fetched twice — once by middleware and once by a client `useEffect`. Check if NextAuth's `useSession()` hook is being called in two different components that don't share a `<SessionProvider>`. Wrap the entire app in a single `<SessionProvider>` at the root layout to share session state.

---

## Fix #9 — Add DB index on `entries.user_id` + `entries.created_at` 🟡

**Measured:** `GET /api/entries?filter=all` takes ~350–870ms for only 3 rows  

With only 3 entries returning in 350ms+, the query is hitting a slow DB connection, not doing a real full scan. But as data grows, add:
```sql
CREATE INDEX IF NOT EXISTS idx_entries_user_created ON entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_streak_user_id ON streak(user_id);
```

---

## Summary: Expected UX improvement after all fixes

| Flow | Before | After | Saving |
|---|---|---|---|
| Gallery initial load | ~2,500ms | ~200ms (SSR) | **−2,300ms** |
| Save new expense | ~3,089ms | ~1,163ms | **−1,926ms** |
| Gallery reload after save | ~1,302ms | ~870ms | **−432ms** |
| Any page load (settings) | +820ms | ~0ms (cached) | **−820ms** |

### Implementation order (highest ROI first)
1. **Fix #1** — Remove `setTimeout(..., 1200)` → 30 min, saves 1,200ms immediately
2. **Fix #2** — Parallelize streak + budget → 30 min, saves 386ms
3. **Fix #3** — Cache `/api/wrapped` → 1 hour, saves 1,500ms per page load
4. **Fix #4** — Cache `/api/settings` → 30 min, saves 820ms per page load
5. **Fix #5** — Parallel gallery reload → 15 min, saves 410ms
6. **Fix #6** — Fix `/api/budgets` slow query → 1 hour
7. **Fix #7** — SSR gallery data → half day, eliminates load waterfall entirely
8. **Fix #8** — Deduplicate session calls → 30 min
9. **Fix #9** — Add DB indexes → 30 min
