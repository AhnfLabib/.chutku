# Runnable MVP with Neumorphism UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take .chtku from never-run scaffold to a verified, end-to-end working app (login → onboarding → invite → check-in → memories → dashboard) styled with the approved Neumorphism system.

**Architecture:** Four stages per the spec (`docs/superpowers/specs/2026-07-02-runnable-mvp-neumorphism-design.md`): (1) make the Next.js 16 build pass by adding the missing root layout / Tailwind v4 pipeline, (2) fix the service-role client and enforce the 24hr check-in reveal in RLS (migration 008), (3) verify Phase 1 against the user's real Supabase project with two accounts, (4) build the Phase 2 UI. Backend API routes are already complete and stay as-is except where noted.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4 (`@theme` tokens), Supabase (Postgres + Auth + RLS), Anthropic Claude Haiku, lucide-react icons.

**Testing note:** This project has no unit-test framework and adding one is out of scope. Verification per task is `npx tsc --noEmit` + `npm run build`; acceptance is the two-account browser flow (Tasks 8 and 15). Task 7 requires the user's `.env.local` — HALT and ask if it is missing.

**Design tokens (used by every UI task):** utility classes come from the `@theme` block in Task 2: `bg-bg`, `bg-bg-deep`, `bg-surface`, `text-ink`, `text-ink-muted`, `text-ink-soft`, `text-accent`, `shadow-raised`, `shadow-raised-sm`, `shadow-inset`, `shadow-inset-deep`, `rounded-neu` (20px), `rounded-neu-sm` (14px). Raised = resting/actionable, inset = active/selected/input. No borders anywhere.

---

## Stage 1 — Make it build

### Task 1: Add .gitignore

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Create `.gitignore`**

```gitignore
# dependencies
node_modules/

# next.js
.next/
out/
next-env.d.ts

# production
build/

# env
.env
.env*.local

# misc
.DS_Store
*.pem
*.tsbuildinfo

# supabase
supabase/.temp/
supabase/.branches/
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: add .gitignore before any local env/build artifacts exist"
```

### Task 2: Root layout, globals.css with Neumorphism tokens, PostCSS config

**Files:**
- Create: `postcss.config.mjs`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`

- [ ] **Step 1: Create `postcss.config.mjs`**

```js
const config = {
  plugins: ['@tailwindcss/postcss'],
}

export default config
```

- [ ] **Step 2: Create `src/app/globals.css`**

Tailwind v4 import plus the approved Neumorphism tokens from `mockups/neumorphism-preview.html`, and the custom range-slider styling (native `<input type="range">` can't be styled with utilities alone).

```css
@import "tailwindcss";

@theme {
  --color-bg: #E8E4DF;
  --color-bg-deep: #DDD8D2;
  --color-surface: #E8E4DF;
  --color-ink: #4A4540;
  --color-ink-muted: #8A837A;
  --color-ink-soft: #A39E96;
  --color-accent: #B8957A;
  --color-accent-soft: #D4B8A0;
  --color-rose: #C9A09A;
  --shadow-raised: 8px 8px 16px #B8B0A6, -8px -8px 16px #FAF8F5;
  --shadow-raised-sm: 5px 5px 10px #B8B0A6, -5px -5px 10px #FAF8F5;
  --shadow-inset: inset 4px 4px 8px #B8B0A6, inset -4px -4px 8px #FAF8F5;
  --shadow-inset-deep: inset 6px 6px 12px #B8B0A6, inset -6px -6px 12px #FAF8F5;
  --radius-neu: 20px;
  --radius-neu-sm: 14px;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
  background: var(--color-bg);
  color: var(--color-ink);
}

/* Neumorphic range slider: inset track, accent gradient fill (via inline
   background-image set from React state), raised circular thumb. */
input[type='range'].neu-range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 10px;
  border-radius: 999px;
  background-color: var(--color-bg-deep);
  box-shadow: var(--shadow-inset);
  background-repeat: no-repeat;
  outline: none;
}

input[type='range'].neu-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: var(--color-surface);
  box-shadow: var(--shadow-raised-sm);
  cursor: pointer;
}

input[type='range'].neu-range::-moz-range-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: var(--color-surface);
  box-shadow: var(--shadow-raised-sm);
  cursor: pointer;
}
```

- [ ] **Step 3: Create `src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '.chtku',
  description: 'A private space for two.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add postcss.config.mjs src/app/globals.css src/app/layout.tsx
git commit -m "feat: add root layout and Tailwind v4 pipeline with Neumorphism tokens"
```

### Task 3: Prune unused dependencies, install, first build

**Files:**
- Modify: `package.json` (dependencies block)

- [ ] **Step 1: Remove unused dependencies from `package.json`**

Grep confirmed none of these are imported anywhere in `src/`: `@tanstack/react-query`, `zustand`, `react-hook-form`, `@hookform/resolvers`, `date-fns`, `zod`, `clsx`, `tailwind-merge`. Keep `lucide-react` (used by `AppNav`). The dependencies block becomes:

```json
"dependencies": {
  "@anthropic-ai/sdk": "^0.106.0",
  "@supabase/ssr": "^0.12.0",
  "@supabase/supabase-js": "^2.108.2",
  "lucide-react": "^1.22.0",
  "next": "16.2.9",
  "react": "19.2.4",
  "react-dom": "19.2.4"
}
```

- [ ] **Step 2: Install**

Run: `npm install`
Expected: lockfile created, no errors.

- [ ] **Step 3: Typecheck and build**

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds. If TypeScript errors surface in existing files, fix minimally (do not restructure — Stage 2/4 tasks rewrite the known-broken files).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: prune unused dependencies, add lockfile"
```

---

## Stage 2 — Fix the foundation

### Task 4: True service-role client

**Files:**
- Modify: `src/lib/supabase/server.ts` (replace `createServiceClient`)
- Modify: `src/app/api/invite/accept/route.ts:10` (drop `await`)
- Modify: `src/app/api/invite/route.ts:1` (drop unused import)

- [ ] **Step 1: Replace `createServiceClient` in `src/lib/supabase/server.ts`**

The current version passes user cookies to `@supabase/ssr`, so requests carry the user's JWT and run under user RLS. Replace with a plain `supabase-js` client (no cookies, no session):

```ts
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
```

Delete the entire existing `createServiceClient` function and replace with:

```ts
// Service-role client: bypasses RLS. Never attach user cookies/session here —
// @supabase/ssr would substitute the user's JWT and downgrade to user RLS.
export function createServiceClient() {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
```

`createClient` and `getWorkspaceId` stay unchanged.

- [ ] **Step 2: Update callers**

In `src/app/api/invite/accept/route.ts` change:

```ts
const service = await createServiceClient()
```

to:

```ts
const service = createServiceClient()
```

In `src/app/api/invite/route.ts` change the import line to drop the now-unused `createServiceClient`:

```ts
import { createClient, getWorkspaceId } from '@/lib/supabase/server'
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/server.ts src/app/api/invite/accept/route.ts src/app/api/invite/route.ts
git commit -m "fix: make service client actually use service role (no user session)"
```

### Task 5: Migration 008 — enforce 24hr check-in reveal in RLS

**Files:**
- Create: `supabase/migrations/008_checkin_reveal_rls.sql`

- [ ] **Step 1: Write the migration**

Rules: own rows always readable/writable; partner rows readable only when the reveal condition holds (partner submitted >24h ago, OR I have also submitted for that date). The "I also submitted" check must go through a `security definer` helper — a `checkins` policy cannot subquery `checkins` without recursive RLS.

```sql
-- Enforce the 24hr check-in reveal at the database level (was API-only).

-- Helper: has the current user submitted a check-in for this workspace/date?
-- security definer so the policy below can consult checkins without recursion.
create or replace function i_submitted_checkin(ws_id uuid, d date)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from checkins
    where workspace_id = ws_id
      and checkin_date = d
      and user_id = auth.uid()
  )
$$;

drop policy "workspace checkins" on checkins;

-- Own rows: full access within your workspace.
create policy "own checkins all" on checkins
  for all
  using (workspace_id = get_my_workspace_id() and user_id = auth.uid())
  with check (workspace_id = get_my_workspace_id() and user_id = auth.uid());

-- Partner rows: readable only once revealed.
create policy "partner checkins revealed" on checkins
  for select
  using (
    workspace_id = get_my_workspace_id()
    and user_id <> auth.uid()
    and (
      submitted_at < now() - interval '24 hours'
      or i_submitted_checkin(workspace_id, checkin_date)
    )
  );
```

Compatibility check (no code change needed, verify by reading):
- `update_checkin_streak()` runs as invoker; when the *second* partner submits, `i_submitted_checkin` is true so both rows are visible and `count(*) = 2` still works.
- `/api/checkin` GET reads partner rows with the user client; RLS now hides them until revealed, which matches the route's own unlock logic (defense in depth).
- Edge functions use the service role and bypass RLS.

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/008_checkin_reveal_rls.sql
git commit -m "fix: enforce 24hr check-in reveal in RLS, not just API"
```

### Task 6: Dashboard data helper + remove dead self-fetch

**Files:**
- Create: `src/lib/dashboard.ts`
- Modify: `src/app/api/dashboard/route.ts` (delegate to helper)
- Modify: `src/app/(app)/dashboard/page.tsx` (delete dead code only; full UI comes in Task 11)

- [ ] **Step 1: Create `src/lib/dashboard.ts`**

Extracted from the current `/api/dashboard` route, extended with streak + today's summary (the Task 11 dashboard needs them; keeping one query path DRY).

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CheckinStreak, CheckinSummary, PriorityItem } from '@/types'

export interface DashboardData {
  priorityItems: PriorityItem[]
  streak: CheckinStreak | null
  summary: CheckinSummary | null
}

export async function getDashboardData(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string
): Promise<DashboardData> {
  const today = new Date().toISOString().split('T')[0]
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const priorityItems: PriorityItem[] = []

  // Priority 1: planned dates within the next 7 days
  const { data: upcomingDates } = await supabase
    .from('date_plans')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'planned')
    .gte('scheduled_for', today)
    .lte('scheduled_for', in7Days)
    .order('scheduled_for', { ascending: true })
    .limit(1)

  if (upcomingDates?.length) {
    priorityItems.push({ type: 'milestone', data: upcomingDates[0] as Record<string, unknown> })
  }

  // Priority 2: today's check-in status
  const { data: checkins } = await supabase
    .from('checkins')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('checkin_date', today)

  const myCheckin = checkins?.find(c => c.user_id === userId)
  const partnerCheckin = checkins?.find(c => c.user_id !== userId)

  if (!myCheckin && !partnerCheckin) {
    priorityItems.push({ type: 'checkin_pending', data: {} })
  } else if (myCheckin && !partnerCheckin) {
    priorityItems.push({ type: 'checkin_partial', data: { submitted: true, waitingForPartner: true } })
  } else if (!myCheckin && partnerCheckin) {
    priorityItems.push({ type: 'checkin_partial', data: { submitted: false, partnerWaiting: true } })
  } else {
    priorityItems.push({ type: 'checkin_complete', data: {} })
  }

  // Priority 3: next upcoming date plan
  if (priorityItems.length < 3) {
    const { data: nextDate } = await supabase
      .from('date_plans')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('status', ['idea', 'planned'])
      .order('scheduled_for', { ascending: true, nullsFirst: false })
      .limit(1)

    if (nextDate?.length) {
      priorityItems.push({ type: 'next_date', data: nextDate[0] as Record<string, unknown> })
    }
  }

  const [{ data: streak }, { data: summary }] = await Promise.all([
    supabase.from('checkin_streaks').select('*').eq('workspace_id', workspaceId).maybeSingle(),
    supabase
      .from('checkin_summaries')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('checkin_date', today)
      .maybeSingle(),
  ])

  return { priorityItems, streak: streak ?? null, summary: summary ?? null }
}
```

- [ ] **Step 2: Rewrite `src/app/api/dashboard/route.ts` to delegate**

```ts
import { createClient, getWorkspaceId } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getDashboardData } from '@/lib/dashboard'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const workspaceId = await getWorkspaceId(supabase)
  const data = await getDashboardData(supabase, workspaceId, user.id)
  return NextResponse.json(data)
}
```

- [ ] **Step 3: Strip dead code from `src/app/(app)/dashboard/page.tsx`**

Delete the unused `import { createClient } ...` line and the entire `getDashboardData` function (lines 1–9 of the current file) — it fetches its own API without cookies (always 401) and is never called. Keep the rest of the page as-is for now; Task 11 rebuilds it.

- [ ] **Step 4: Verify and commit**

Run: `npx tsc --noEmit && npm run build`
Expected: clean.

```bash
git add src/lib/dashboard.ts src/app/api/dashboard/route.ts "src/app/(app)/dashboard/page.tsx"
git commit -m "refactor: extract dashboard data helper, remove dead self-fetch"
```

---

## Stage 3 — Verify Phase 1 end-to-end

### Task 7: Environment + apply migrations

**Files:**
- Create: `.env.local` (user-provided values; git-ignored)

- [ ] **Step 1: Confirm `.env.local` exists with all five vars**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**HALT if missing:** ask the user for their existing Supabase project's URL and keys (plus Anthropic key). Do not fabricate values.

- [ ] **Step 2: Apply all 8 migrations**

Preferred: `npx supabase link --project-ref <ref>` then `npx supabase db push`.
Fallback (per spec): run each file from `supabase/migrations/` in order via the Supabase MCP `apply_migration` tool or the SQL editor.

- [ ] **Step 3: Verify schema**

Confirm (via `supabase` CLI, MCP `list_tables`, or SQL editor) that these tables exist: `workspaces`, `profiles`, `invite_tokens`, `questionnaire_answers`, `memories`, `private_memories`, `checkin_prompts` (20 seeded rows), `checkins`, `checkin_summaries`, `checkin_streaks`, `date_plans`; and that policies `own checkins all` and `partner checkins revealed` exist on `checkins`.

### Task 8: Two-account browser verification

No file changes. Run `npm run dev` and verify in a real browser:

- [ ] **Step 1: Account A full flow**

Login via magic link → redirected to `/onboarding` → complete questionnaire (fill at least 2 answers) → memories seeded (verify later on memories API) → generate invite link on `/onboarding/invite` → copy it → land on `/dashboard`.

- [ ] **Step 2: Account B joins**

Open invite link (fresh browser profile/incognito) → magic-link login → accept invite → confirm B's profile row has A's `workspace_id` (Supabase table editor or SQL).

If magic-link inboxes are impractical, generate action links with the service role instead: `POST {SUPABASE_URL}/auth/v1/admin/generate_link` with headers `apikey: <service_role_key>`, `Authorization: Bearer <service_role_key>` and body `{"type": "magiclink", "email": "<address>"}`, then open the returned `action_link`.

- [ ] **Step 3: Check-in privacy + reveal**

As A: submit a check-in via `POST /api/checkin` (UI arrives in Task 12; use fetch from devtools console or curl with A's cookies). As B, before submitting: `GET /api/checkin` must show `partnerCheckin: null`. Directly query Supabase as B (browser console with the app's client): `select * from checkins` must NOT return A's row (RLS test). Then B submits → both revealed → `checkin_summaries` row generated → streak = 1.

- [ ] **Step 4: Record results**

Note any failures, fix root causes, re-verify. Do not proceed to Stage 4 until this passes.

---

## Stage 4 — Phase 2 UI (Neumorphism)

### Task 9: Neumorphic AppNav + app shell

**Files:**
- Modify: `src/components/layout/AppNav.tsx`
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Rewrite `src/components/layout/AppNav.tsx`**

Floating raised pill track; active item inset with `bg-bg-deep` (state shown by color + shadow, never shadow alone).

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageCircle, Calendar, Heart, Settings } from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/checkin', icon: Heart, label: 'Check In' },
  { href: '/memories', icon: MessageCircle, label: 'Memories' },
  { href: '/dates', icon: Calendar, label: 'Dates' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export default function AppNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg px-4 pb-5 pt-3">
      <div className="max-w-md mx-auto flex items-center justify-around bg-surface rounded-3xl shadow-raised px-1.5 py-2.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-neu-sm text-[9px] font-semibold transition-all ${
                active ? 'text-ink bg-bg-deep shadow-inset' : 'text-ink-soft'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.6} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Update `src/app/(app)/layout.tsx` shell classes**

Replace the returned JSX with (auth/onboarding logic above it unchanged):

```tsx
return (
  <div className="min-h-screen bg-bg flex flex-col">
    <main className="flex-1 max-w-md mx-auto w-full px-5 py-7 pb-28">
      {children}
    </main>
    <AppNav />
  </div>
)
```

- [ ] **Step 3: Verify and commit**

Run: `npm run build`
Expected: clean.

```bash
git add src/components/layout/AppNav.tsx "src/app/(app)/layout.tsx"
git commit -m "feat: neumorphic bottom nav and app shell"
```

### Task 10: Restyle auth + onboarding + invite screens

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/onboarding/page.tsx`
- Modify: `src/app/onboarding/questionnaire/page.tsx`
- Modify: `src/app/onboarding/invite/page.tsx`
- Modify: `src/app/invite/[token]/page.tsx`

Logic in all five files stays identical — only JSX classes/structure change. Shared patterns: page wrapper `min-h-screen bg-bg flex items-center justify-center p-5`; card `w-full max-w-sm bg-surface rounded-neu shadow-raised p-8`; input `w-full px-4 py-3.5 rounded-neu-sm bg-bg-deep shadow-inset text-sm text-ink placeholder:text-ink-soft outline-none`; primary button `w-full py-4 bg-surface text-ink rounded-neu shadow-raised text-sm font-semibold active:shadow-inset disabled:opacity-50 transition-all`; secondary/skip button same but `text-ink-muted` and `shadow-raised-sm`.

- [ ] **Step 1: Rewrite `src/app/(auth)/login/page.tsx`**

```tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-5">
      <div className="w-full max-w-sm bg-surface rounded-neu shadow-raised p-8 text-center">
        <h1 className="text-[28px] font-semibold tracking-tight mb-1.5">.chtku</h1>
        <p className="text-ink-muted text-[13px] mb-7">Your private space, together.</p>

        {sent ? (
          <div className="bg-bg-deep rounded-neu-sm shadow-inset p-4 text-sm text-ink-muted">
            Check your email for a magic link.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3.5 rounded-neu-sm bg-bg-deep shadow-inset text-sm text-ink placeholder:text-ink-soft outline-none text-left"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-surface text-ink rounded-neu shadow-raised text-sm font-semibold active:shadow-inset disabled:opacity-50 transition-all"
            >
              {loading ? 'Sending…' : 'Continue with email'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite `src/app/onboarding/page.tsx` JSX**

Keep the server-side auth/redirect logic (lines 1–15 of the current file) unchanged; replace the returned JSX:

```tsx
return (
  <div className="min-h-screen bg-bg flex items-center justify-center p-5">
    <div className="w-full max-w-sm bg-surface rounded-neu shadow-raised p-8">
      <h1 className="text-xl font-semibold mb-2">Welcome to .chtku</h1>
      <p className="text-ink-muted text-[13px] mb-7">
        Let&apos;s set things up so .chtku feels personal from day one.
      </p>
      <a
        href="/onboarding/questionnaire"
        className="block w-full text-center py-4 bg-surface text-ink rounded-neu shadow-raised text-sm font-semibold active:shadow-inset transition-all"
      >
        Get started
      </a>
    </div>
  </div>
)
```

- [ ] **Step 3: Rewrite `src/app/onboarding/questionnaire/page.tsx` JSX**

Keep state + `handleSubmit` unchanged; replace the returned JSX:

```tsx
return (
  <div className="min-h-screen bg-bg flex items-center justify-center p-5">
    <div className="w-full max-w-lg bg-surface rounded-neu shadow-raised p-8">
      <h2 className="text-xl font-semibold mb-1">Tell us about yourselves</h2>
      <p className="text-ink-muted text-[13px] mb-6">
        These answers seed .chtku&apos;s memory before your first chat. Skip anything you&apos;d rather add later.
      </p>
      <form onSubmit={handleSubmit} className="space-y-5">
        {QUESTIONNAIRE_QUESTIONS.map(q => (
          <div key={q.key}>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
              {q.label}
            </label>
            <textarea
              rows={2}
              value={answers[q.key] ?? ''}
              onChange={e => setAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
              className="w-full px-4 py-3.5 rounded-neu-sm bg-bg-deep shadow-inset text-sm text-ink placeholder:text-ink-soft outline-none resize-none"
              placeholder="Optional — you can always add this later"
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-surface text-ink rounded-neu shadow-raised text-sm font-semibold active:shadow-inset disabled:opacity-50 transition-all"
        >
          {loading ? 'Saving…' : 'Save and continue'}
        </button>
      </form>
    </div>
  </div>
)
```

- [ ] **Step 4: Rewrite `src/app/onboarding/invite/page.tsx` JSX**

Keep state + `generateLink` + `copy` unchanged; replace the returned JSX:

```tsx
return (
  <div className="min-h-screen bg-bg flex items-center justify-center p-5">
    <div className="w-full max-w-sm bg-surface rounded-neu shadow-raised p-8">
      <h2 className="text-xl font-semibold mb-2">Invite your partner</h2>
      <p className="text-ink-muted text-[13px] mb-6">
        Send them a private invite link. It expires in 72 hours and can only be used once.
      </p>

      {!token ? (
        <button
          onClick={generateLink}
          disabled={loading}
          className="w-full py-4 bg-surface text-ink rounded-neu shadow-raised text-sm font-semibold active:shadow-inset disabled:opacity-50 transition-all mb-4"
        >
          {loading ? 'Generating…' : 'Generate invite link'}
        </button>
      ) : (
        <div className="flex items-center gap-2 px-4 py-3.5 bg-bg-deep rounded-neu-sm shadow-inset mb-4">
          <span className="flex-1 text-xs text-ink-muted truncate font-mono">
            {location.origin}/invite/{token}
          </span>
          <button onClick={copy} className="text-xs text-accent font-semibold">
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      <button
        onClick={() => router.push('/dashboard')}
        className="w-full py-3.5 bg-surface text-ink-muted rounded-neu shadow-raised-sm text-sm font-medium active:shadow-inset transition-all"
      >
        Skip for now, go to dashboard
      </button>
    </div>
  </div>
)
```

- [ ] **Step 5: Rewrite `src/app/invite/[token]/page.tsx` JSX**

Keep all logic (`handleAccept`, `handleLogin`, steps) unchanged; replace the three returned JSX blocks:

```tsx
if (step === 'done') {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <p className="text-ink-muted text-sm">Linked! Taking you to onboarding…</p>
    </div>
  )
}

if (step === 'login') {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-5">
      <div className="w-full max-w-sm bg-surface rounded-neu shadow-raised p-8">
        <h2 className="text-lg font-semibold mb-4">Create your account to join</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3.5 rounded-neu-sm bg-bg-deep shadow-inset text-sm text-ink placeholder:text-ink-soft outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-surface text-ink rounded-neu shadow-raised text-sm font-semibold active:shadow-inset disabled:opacity-50 transition-all"
          >
            {loading ? 'Sending…' : 'Send magic link'}
          </button>
        </form>
      </div>
    </div>
  )
}

return (
  <div className="min-h-screen bg-bg flex items-center justify-center p-5">
    <div className="w-full max-w-sm bg-surface rounded-neu shadow-raised p-8 text-center">
      <h2 className="text-xl font-semibold mb-2">You&apos;ve been invited</h2>
      <p className="text-ink-muted text-[13px] mb-8">Join your partner&apos;s private .chtku space.</p>
      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full py-4 bg-surface text-ink rounded-neu shadow-raised text-sm font-semibold active:shadow-inset disabled:opacity-50 transition-all"
      >
        {loading ? 'Joining…' : 'Accept invite'}
      </button>
    </div>
  </div>
)
```

- [ ] **Step 6: Verify and commit**

Run: `npm run build`
Expected: clean.

```bash
git add "src/app/(auth)/login/page.tsx" src/app/onboarding/page.tsx src/app/onboarding/questionnaire/page.tsx src/app/onboarding/invite/page.tsx "src/app/invite/[token]/page.tsx"
git commit -m "feat: neumorphic auth, onboarding, and invite screens"
```

### Task 11: Dashboard UI

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx` (full rewrite)

- [ ] **Step 1: Rewrite the dashboard page**

Server component; queries via the Task 6 helper (no self-fetch).

```tsx
import Link from 'next/link'
import { Heart, Sparkles, Plus, BookHeart, Calendar, Hourglass } from 'lucide-react'
import { createClient, getWorkspaceId } from '@/lib/supabase/server'
import { getDashboardData } from '@/lib/dashboard'
import type { PriorityItem } from '@/types'

function priorityContent(item: PriorityItem): { icon: React.ReactNode; title: string; sub: string } {
  switch (item.type) {
    case 'milestone':
    case 'next_date': {
      const d = item.data as { title?: string; scheduled_for?: string | null; status?: string }
      return {
        icon: <Calendar size={18} className="text-accent" />,
        title: d.title ?? 'Upcoming date',
        sub: d.scheduled_for ? `${d.status === 'planned' ? 'Planned' : 'Idea'} · ${d.scheduled_for}` : 'No date set yet',
      }
    }
    case 'checkin_pending':
      return { icon: <Heart size={18} className="text-accent" />, title: 'Check in today', sub: 'Neither of you has checked in yet' }
    case 'checkin_partial': {
      const d = item.data as { submitted?: boolean }
      return d.submitted
        ? { icon: <Hourglass size={18} className="text-accent" />, title: 'Waiting for your partner', sub: 'You checked in — theirs reveals soon' }
        : { icon: <Heart size={18} className="text-accent" />, title: 'Your partner checked in', sub: 'Add yours to reveal both' }
    }
    case 'checkin_complete':
      return { icon: <Sparkles size={18} className="text-accent" />, title: 'Check-in complete', sub: "See today's summary below" }
  }
}

const quickActions = [
  { label: 'Check In', href: '/checkin', icon: Heart },
  { label: 'Plan Date', href: '/dates', icon: Sparkles },
  { label: 'Add Memory', href: '/memories', icon: Plus },
  { label: 'Memories', href: '/memories', icon: BookHeart },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const workspaceId = await getWorkspaceId(supabase)
  const { priorityItems, streak, summary } = await getDashboardData(supabase, workspaceId, user!.id)

  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight mb-1">Home</h1>
      <p className="text-ink-muted text-[13px] mb-6">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      <div className="flex items-center gap-4 bg-surface rounded-neu shadow-raised p-4.5 mb-4">
        <div className="w-13 h-13 shrink-0 rounded-full bg-surface shadow-raised-sm flex items-center justify-center text-xl font-bold text-accent">
          {streak?.current_streak ?? 0}
        </div>
        <div>
          <div className="text-[13px] text-ink-muted">Current streak</div>
          <div className="text-[15px] font-semibold">
            {streak?.current_streak ?? 0} {streak?.current_streak === 1 ? 'day' : 'days'} together
          </div>
        </div>
      </div>

      <div className="space-y-2.5 mb-4">
        {priorityItems.map((item, i) => {
          const { icon, title, sub } = priorityContent(item)
          return (
            <div key={i} className="flex items-center gap-3 bg-surface rounded-neu-sm shadow-raised-sm p-3.5">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-bg-deep shadow-inset flex items-center justify-center">
                {icon}
              </div>
              <div>
                <div className="text-[13px] font-semibold">{title}</div>
                <div className="text-[11px] text-ink-muted">{sub}</div>
              </div>
            </div>
          )
        })}
      </div>

      {summary && (
        <div className="bg-surface rounded-neu shadow-raised p-4.5 mb-4">
          <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2">
            Today&apos;s summary
          </div>
          <p className="text-[13px] leading-relaxed text-ink-muted">{summary.summary_text}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {quickActions.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="bg-surface rounded-neu shadow-raised-sm p-4.5 text-center text-xs font-semibold text-ink-muted active:shadow-inset transition-all"
          >
            <Icon size={22} className="mx-auto mb-2 text-accent" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify and commit**

Run: `npm run build`
Expected: clean.

```bash
git add "src/app/(app)/dashboard/page.tsx"
git commit -m "feat: neumorphic dashboard with streak, priorities, and summary"
```

### Task 12: Check-in UI

**Files:**
- Modify: `src/app/(app)/checkin/page.tsx` (full rewrite, becomes client component)

- [ ] **Step 1: Rewrite the check-in page**

States: loading → form (not yet submitted) → submitted (own recap inset + partner locked/revealed + summary). Uses `GET/POST /api/checkin` (shapes in `src/types/index.ts` → `CheckinStateResponse`). Slider fill uses an inline gradient background sized to the value.

```tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import type { CheckinStateResponse } from '@/types'

const SCALES = [
  { key: 'mood', label: 'Mood' },
  { key: 'energy', label: 'Energy' },
  { key: 'stress', label: 'Stress' },
  { key: 'closeness', label: 'Closeness' },
] as const

type ScaleKey = (typeof SCALES)[number]['key']

function fillStyle(value: number) {
  const pct = ((value - 1) / 9) * 100
  return {
    backgroundImage: `linear-gradient(90deg, var(--color-accent-soft), var(--color-accent) ${pct}%, transparent ${pct}%)`,
  }
}

function hoursUntilReveal(partnerSubmittedAt: string): number {
  const revealAt = new Date(partnerSubmittedAt).getTime() + 24 * 60 * 60 * 1000
  return Math.max(1, Math.ceil((revealAt - Date.now()) / (60 * 60 * 1000)))
}

export default function CheckinPage() {
  const [state, setState] = useState<CheckinStateResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [values, setValues] = useState<Record<ScaleKey, number>>({ mood: 5, energy: 5, stress: 5, closeness: 5 })
  const [freeText, setFreeText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/checkin')
    if (res.ok) setState(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, free_text: freeText.trim() || null }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setError(body?.error ?? 'Something went wrong. Try again.')
    } else {
      await load()
    }
    setSubmitting(false)
  }

  const header = (
    <>
      <h1 className="text-[26px] font-semibold tracking-tight mb-1">Check In</h1>
      <p className="text-ink-muted text-[13px] mb-6">
        {state?.streak?.current_streak
          ? `Day ${state.streak.current_streak} streak · prompt rotates daily`
          : 'Prompt rotates daily'}
      </p>
    </>
  )

  if (loading) {
    return (
      <div>
        {header}
        <div className="bg-surface rounded-neu shadow-raised p-5 text-[13px] text-ink-muted">Loading…</div>
      </div>
    )
  }

  if (!state) {
    return (
      <div>
        {header}
        <div className="bg-surface rounded-neu shadow-raised p-5 text-[13px] text-ink-muted">
          Couldn&apos;t load today&apos;s check-in. Refresh to try again.
        </div>
      </div>
    )
  }

  // ── Not yet submitted: the form ──────────────────────────────────────────
  if (!state.myCheckin) {
    return (
      <div>
        {header}
        <form onSubmit={submit} className="bg-surface rounded-neu shadow-raised p-5">
          <p className="text-[15px] font-medium leading-relaxed mb-5">
            &ldquo;{state.prompt?.prompt_text ?? 'How are you really doing today?'}&rdquo;
          </p>

          {SCALES.map(({ key, label }) => (
            <div key={key} className="mb-4">
              <div className="flex justify-between text-xs font-semibold text-ink-muted mb-2">
                <span>{label}</span>
                <span className="text-accent">{values[key]}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={values[key]}
                onChange={e => setValues(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                className="neu-range"
                style={fillStyle(values[key])}
              />
            </div>
          ))}

          <textarea
            rows={3}
            value={freeText}
            onChange={e => setFreeText(e.target.value)}
            placeholder="Anything else on your mind…"
            className="w-full px-4 py-3.5 rounded-neu-sm bg-bg-deep shadow-inset text-sm text-ink placeholder:text-ink-soft outline-none resize-none mb-2"
          />

          {error && <p className="text-[12px] text-rose mb-2">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-surface text-ink rounded-neu shadow-raised text-sm font-semibold active:shadow-inset disabled:opacity-50 transition-all"
          >
            {submitting ? 'Submitting…' : 'Submit check-in'}
          </button>
        </form>
      </div>
    )
  }

  // ── Submitted: own recap + partner state ─────────────────────────────────
  const mine = state.myCheckin
  return (
    <div>
      {header}

      <div className="bg-surface rounded-neu shadow-raised p-5 mb-4">
        <div className="text-xs text-ink-muted mb-3">Your response</div>
        <div className="bg-bg-deep rounded-neu-sm shadow-inset p-4">
          <div className="text-xs text-ink-muted mb-1.5">
            Mood {mine.mood} · Energy {mine.energy} · Stress {mine.stress} · Closeness {mine.closeness}
          </div>
          {mine.free_text && <p className="text-[13px] leading-relaxed">{mine.free_text}</p>}
        </div>
      </div>

      {state.partnerCheckin ? (
        <div className="bg-surface rounded-neu shadow-raised p-5 mb-4">
          <div className="text-xs text-ink-muted mb-3">Your partner&apos;s response</div>
          <div className="bg-bg-deep rounded-neu-sm shadow-inset p-4">
            <div className="text-xs text-ink-muted mb-1.5">
              Mood {state.partnerCheckin.mood} · Energy {state.partnerCheckin.energy} · Stress{' '}
              {state.partnerCheckin.stress} · Closeness {state.partnerCheckin.closeness}
            </div>
            {state.partnerCheckin.free_text && (
              <p className="text-[13px] leading-relaxed">{state.partnerCheckin.free_text}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-neu shadow-raised p-7 mb-4 text-center">
          <div className="w-16 h-16 mx-auto mb-3.5 rounded-full bg-surface shadow-inset-deep flex items-center justify-center">
            <Lock size={22} className="text-ink-muted" />
          </div>
          <div className="text-sm font-semibold mb-1">Partner&apos;s response locked</div>
          <div className="text-xs text-ink-muted">
            {state.partnerSubmittedAt
              ? `Reveals in ${hoursUntilReveal(state.partnerSubmittedAt)}h — or when you both check in`
              : "Waiting for your partner to check in"}
          </div>
        </div>
      )}

      {state.summary && (
        <div className="bg-surface rounded-neu shadow-raised p-5">
          <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2">
            Today&apos;s summary
          </div>
          <p className="text-[13px] leading-relaxed text-ink-muted">{state.summary.summary_text}</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify and commit**

Run: `npm run build`
Expected: clean.

```bash
git add "src/app/(app)/checkin/page.tsx"
git commit -m "feat: neumorphic check-in flow with sliders, lock, and reveal"
```

### Task 13: Memories UI

**Files:**
- Modify: `src/app/(app)/memories/page.tsx` (full rewrite, becomes client component)

- [ ] **Step 1: Rewrite the memories page**

List with tag-filter pills (inset when active), FAB toggling a create/edit form, edit/delete on own memories only (`created_by === userId`; the DELETE policy enforces this server-side too). Uses `GET/POST /api/memories`, `PATCH/DELETE /api/memories/[id]`.

```tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Memory } from '@/types'

interface FormState {
  id: string | null
  title: string
  content: string
  tags: string
  memory_date: string
}

const EMPTY_FORM: FormState = { id: null, title: '', content: '', tags: '', memory_date: '' }

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (tag: string | null) => {
    const res = await fetch(tag ? `/api/memories?tag=${encodeURIComponent(tag)}` : '/api/memories')
    if (res.ok) setMemories(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    load(null)
  }, [load])

  function selectTag(tag: string | null) {
    setActiveTag(tag)
    load(tag)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setError(null)

    const payload = {
      title: form.title,
      content: form.content,
      tags: form.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
      memory_date: form.memory_date || null,
    }

    const res = form.id
      ? await fetch(`/api/memories/${form.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      : await fetch('/api/memories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setError(body?.error ?? 'Could not save. Try again.')
    } else {
      setForm(null)
      await load(activeTag)
    }
    setSaving(false)
  }

  async function remove(id: string) {
    const res = await fetch(`/api/memories/${id}`, { method: 'DELETE' })
    if (res.ok) await load(activeTag)
  }

  const allTags = [...new Set(memories.flatMap(m => m.tags))].sort()

  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight mb-1">Memories</h1>
      <p className="text-ink-muted text-[13px] mb-5">
        {memories.length} shared · tagged &amp; filterable
      </p>

      {allTags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-5">
          <button
            onClick={() => selectTag(null)}
            className={`text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full transition-all ${
              activeTag === null ? 'text-accent bg-bg-deep shadow-inset' : 'text-ink-soft bg-surface shadow-raised-sm'
            }`}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => selectTag(tag)}
              className={`text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full transition-all ${
                activeTag === tag ? 'text-accent bg-bg-deep shadow-inset' : 'text-ink-soft bg-surface shadow-raised-sm'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {form && (
        <form onSubmit={save} className="bg-surface rounded-neu shadow-raised p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold">{form.id ? 'Edit memory' : 'New memory'}</span>
            <button type="button" onClick={() => setForm(null)} className="text-ink-soft">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-3">
            <input
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Title"
              className="w-full px-4 py-3 rounded-neu-sm bg-bg-deep shadow-inset text-sm text-ink placeholder:text-ink-soft outline-none"
            />
            <textarea
              required
              rows={3}
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="What do you want to remember?"
              className="w-full px-4 py-3 rounded-neu-sm bg-bg-deep shadow-inset text-sm text-ink placeholder:text-ink-soft outline-none resize-none"
            />
            <input
              value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })}
              placeholder="Tags, comma separated (favorite, event…)"
              className="w-full px-4 py-3 rounded-neu-sm bg-bg-deep shadow-inset text-sm text-ink placeholder:text-ink-soft outline-none"
            />
            <input
              type="date"
              value={form.memory_date}
              onChange={e => setForm({ ...form, memory_date: e.target.value })}
              className="w-full px-4 py-3 rounded-neu-sm bg-bg-deep shadow-inset text-sm text-ink-muted outline-none"
            />
            {error && <p className="text-[12px] text-rose">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-surface text-ink rounded-neu shadow-raised text-sm font-semibold active:shadow-inset disabled:opacity-50 transition-all"
            >
              {saving ? 'Saving…' : form.id ? 'Save changes' : 'Add memory'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="bg-surface rounded-neu shadow-raised p-5 text-[13px] text-ink-muted">Loading…</div>
      ) : memories.length === 0 ? (
        <div className="bg-surface rounded-neu shadow-raised p-7 text-center text-[13px] text-ink-muted">
          No memories yet — add your first one.
        </div>
      ) : (
        <div className="space-y-3">
          {memories.map(m => (
            <div key={m.id} className="bg-surface rounded-neu shadow-raised p-4.5">
              {m.tags.length > 0 && (
                <div className="flex gap-1.5 mb-2">
                  {m.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-[10px] font-semibold uppercase tracking-wider text-accent px-2.5 py-1 rounded-full bg-bg-deep shadow-inset"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-sm font-semibold mb-1">{m.title}</div>
              <p className="text-xs text-ink-muted leading-relaxed">{m.content}</p>
              {m.created_by === userId && (
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={() =>
                      setForm({
                        id: m.id,
                        title: m.title,
                        content: m.content,
                        tags: m.tags.join(', '),
                        memory_date: m.memory_date ?? '',
                      })
                    }
                    className="text-ink-soft"
                    aria-label="Edit memory"
                  >
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => remove(m.id)} className="text-ink-soft" aria-label="Delete memory">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!form && (
        <button
          onClick={() => setForm(EMPTY_FORM)}
          aria-label="Add memory"
          className="fixed right-6 bottom-28 w-13 h-13 rounded-full bg-surface shadow-raised text-accent flex items-center justify-center active:shadow-inset transition-all"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify and commit**

Run: `npm run build`
Expected: clean.

```bash
git add "src/app/(app)/memories/page.tsx"
git commit -m "feat: neumorphic memories list with tags, create, edit, delete"
```

### Task 14: Settings + Dates stub restyle

**Files:**
- Modify: `src/app/(app)/settings/page.tsx`
- Modify: `src/app/(app)/dates/page.tsx`

- [ ] **Step 1: Rewrite `src/app/(app)/settings/page.tsx`**

```tsx
export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight mb-6">Settings</h1>
      <a
        href="/api/export"
        className="block bg-surface rounded-neu shadow-raised p-4.5 text-sm font-medium text-ink active:shadow-inset transition-all"
      >
        Export my data (JSON)
      </a>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite `src/app/(app)/dates/page.tsx`**

```tsx
export default function DatesPage() {
  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight mb-6">Dates</h1>
      <div className="bg-surface rounded-neu shadow-raised p-7 text-center text-[13px] text-ink-muted">
        AI date planning arrives in Phase 3.
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify and commit**

Run: `npm run build`
Expected: clean.

```bash
git add "src/app/(app)/settings/page.tsx" "src/app/(app)/dates/page.tsx"
git commit -m "feat: neumorphic settings and dates placeholder"
```

### Task 15: Final verification + README update

**Files:**
- Modify: `README.md` (migrations count, Phase 2 status, design section)

- [ ] **Step 1: Full build + typecheck**

Run: `npx tsc --noEmit && npm run build`
Expected: clean.

- [ ] **Step 2: Re-run the two-account browser flow through the new UI**

Same checklist as Task 8, but entirely through the UI this time: login → onboarding → invite → accept → both check in via the check-in screen → verify lock state, reveal, summary, streak on dashboard → add/edit/delete a memory → filter by tag → export from settings.

- [ ] **Step 3: Update README**

- "7 migrations" → "8 migrations"; add `008_checkin_reveal_rls.sql — 24hr reveal enforced in RLS` to the list.
- Phase 2 section: mark shipped items (check-in UI, memories CRUD, dashboard, streaks); note semantic search deferred pending an embeddings provider.
- Key Design Decisions: update "Check-in unlock is time-based" to note it is enforced by RLS (migration 008), not just the API.
- Add a short "Design" section: Neumorphism system, tokens live in `src/app/globals.css`, reference mockup at `mockups/neumorphism-preview.html`.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: update README for migration 008, Phase 2 status, design system"
```

---

## Self-Review Notes

- **Spec coverage:** Stage 1 → Tasks 1–3; Stage 2 (service client, RLS 008, dashboard fetch) → Tasks 4–6; Stage 3 → Tasks 7–8; Stage 4 (nav, auth/onboarding restyle, dashboard, check-in, memories, settings, dates stub) → Tasks 9–14; verification + docs → Task 15. Deferred items (nudge, recap, embeddings, dates UI, confirmation flow) intentionally have no tasks.
- **Types:** `getDashboardData(supabase, workspaceId, userId)` defined in Task 6 and consumed with the same signature in Task 11. `CheckinStateResponse` fields used in Task 12 match `src/types/index.ts`. Token utility names (`bg-bg-deep`, `text-ink-muted`, `shadow-raised-sm`, `rounded-neu`, `neu-range`) all trace to the Task 2 `@theme` block and CSS.
- **Ordering constraint:** Task 7–8 (user env + verification) sit between foundation fixes and UI. If the user's keys aren't available when reaching Task 7, Tasks 9–14 can proceed first (they don't depend on a live backend to compile), but Task 15's flow verification needs Tasks 7–8 done.
