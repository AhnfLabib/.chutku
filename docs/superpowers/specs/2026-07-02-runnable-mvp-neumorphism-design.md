# .chtku — Runnable MVP with Neumorphism UI

**Date:** 2026-07-02
**Status:** Approved
**Approach:** Staged vertical slice (Approach 1) — make it build, fix the foundation, verify Phase 1 end-to-end, then build the Phase 2 UI in the approved Neumorphism design system.

## Background

An audit of the repo (commit `41fd770`) found:

- The app has never been run: no `node_modules`, no lockfile, no `.env.local`, no `.gitignore`.
- The build is broken by omission: no root `src/app/layout.tsx`, no CSS pipeline (no `globals.css`, no PostCSS config; Tailwind v4 is declared but unwired).
- `createServiceClient()` in `src/lib/supabase/server.ts` constructs the "service role" client with `@supabase/ssr`'s `createServerClient` plus user cookies, so requests carry the user's session JWT and run under the **user's** RLS, not service-role. The invite-accept flow depends on service-role access and is therefore broken.
- The 24hr check-in reveal is enforced only in the API route; the `checkins` RLS policy (`for all using (workspace_id = get_my_workspace_id())`) lets a partner read the other's check-in immediately via the Supabase client.
- `src/app/(app)/dashboard/page.tsx` contains a dead `getDashboardData()` that fetches its own API without forwarding cookies (always 401) and is never called.
- The backend API layer (check-in, memories, dashboard, dates, invite, onboarding, export) is otherwise complete; all Phase 2 UI pages are stubs.

**Deferred to backlog (explicitly out of scope for this milestone):**

- `checkin-nudge` cron date-window bug (`checkin_date = today` never matches check-ins submitted 20h ago) and its missing delivery mechanism.
- `weekly-recap` upsert collision with daily summaries on `(workspace_id, checkin_date)`.
- Real embeddings provider (`embedText()` is a no-op; semantic search stays disabled, recency fallback stays).
- Unconfirmed-memory visibility (RLS hides `confirmed = false` rows, blocking the future AI memory-confirmation flow — a Phase 3 concern).

## Goal

A verified, runnable app: magic-link login → onboarding → partner invite → both partners in one workspace → daily check-in with 24hr reveal → shared memories → dashboard — all styled with the approved Neumorphism system.

## Stage 1 — Make it build

- Add root `src/app/layout.tsx` (html/body shell, font stack, `globals.css` import, metadata).
- Add `src/app/globals.css` with `@import "tailwindcss"` and the Neumorphism design tokens (see Design System) declared in `@theme` so they are available as Tailwind utilities (e.g. `shadow-raised`, `bg-surface`).
- Add `postcss.config.mjs` with `@tailwindcss/postcss`.
- Add `.gitignore` (node_modules, `.next`, `.env*.local`, etc.) **before** any `.env.local` exists.
- Remove unused dependencies: `@tanstack/react-query`, `zustand`, `react-hook-form`, `@hookform/resolvers`, `date-fns`, `zod` (re-add any if Stage 4 actually needs them).
- `npm install` and get `npm run build` passing.

**Done when:** `next build` succeeds with zero errors.

## Stage 2 — Fix the foundation

### 2a. Service client

Rewrite `createServiceClient()` to return a plain `@supabase/supabase-js` `createClient(url, SERVICE_ROLE_KEY, { auth: { persistSession: false } })` — no cookies, no user session, true service-role access. Callers (`/api/invite/accept`) keep the same call shape.

### 2b. Check-in reveal enforced in the database

New migration `008_checkin_reveal_rls.sql`:

- Drop the blanket `for all` policy on `checkins`.
- `insert` / `update` / `delete`: only own rows (`user_id = auth.uid()`) within the workspace.
- `select`: own rows always; partner rows only when the reveal condition holds:
  - partner's `submitted_at` is older than 24 hours, **or**
  - both partners have submitted for that `checkin_date`.
- Because a `checkins` policy cannot subquery `checkins` without infinite RLS recursion, the "I also submitted" check uses a `security definer` helper, e.g. `i_submitted_checkin(ws_id uuid, d date) returns boolean`.
- The API route keeps its existing unlock logic (defense in depth); RLS becomes the guarantee.

### 2c. Dashboard data fetching

Delete the dead self-fetch in `dashboard/page.tsx`. The server component queries Supabase directly (same logic as `/api/dashboard`), or calls a shared helper extracted from that route. `/api/dashboard` remains for client-side refresh if Stage 4 needs it.

**Done when:** build passes and migration 008 applies cleanly.

## Stage 3 — Verify Phase 1 end-to-end

- User supplies `.env.local` (existing Supabase project URL, anon key, service-role key, Anthropic key).
- Apply all 8 migrations to the project via `supabase db push` (SQL editor only as fallback if the CLI can't link).
- Browser verification of the full flow with two accounts:
  1. Magic-link login (account A) → workspace + profile auto-created → onboarding questionnaire → memories seeded → invite link generated.
  2. Account B opens invite link → logs in → accepts → linked to A's workspace (B's orphaned auto-workspace is acceptable for now).
  3. Both accounts submit a check-in; verify partner responses are hidden until both submit, then revealed with AI summary; streak becomes 1.
- Magic-link testing uses two email inboxes the user controls; fallback is Supabase Auth admin-generated links if inbox access is awkward.

**Done when:** the full two-account flow works in a real browser against the real project.

## Stage 4 — Phase 2 UI (Neumorphism)

Build the four core screens against the existing APIs, restyle the five existing screens (login, onboarding ×3, invite accept), and restyle `AppNav`.

- **Dashboard:** streak card, priority items (from dashboard data), today's-summary card, 2×2 quick-action tiles.
- **Check-in:** daily prompt card; four inset sliders (mood, energy, stress, closeness, 1–10); free-text inset textarea; submit. After submitting: own response recap (inset), partner state — locked circle with countdown ("Reveals in Xh — or when they check in") or revealed response + AI summary card.
- **Memories:** tag filter pills (inset when active), memory cards (tags, title, body), floating "+" action button, create/edit form (inset inputs), delete own memories.
- **Settings:** export button restyled. Display-name editing is out of scope for this milestone.
- **Dates:** remains a stub this milestone (Phase 3), but restyled to match.

Client-side data fetching uses plain `fetch` to the existing API routes with minimal `useState`/`useEffect` (no react-query unless genuinely needed).

**Done when:** every screen renders in the Neumorphism system and the Stage 3 flow still passes end-to-end through the new UI.

## Design System — Neumorphism (from approved mockup, `mockups/neumorphism-preview.html`)

Single light theme. All surfaces share the background color; depth comes from dual shadows, never borders.

**Tokens (Tailwind v4 `@theme`):**

| Token | Value | Use |
|---|---|---|
| `--color-bg` / `--color-surface` | `#E8E4DF` | Page + card background (same) |
| `--color-bg-deep` | `#DDD8D2` | Inset wells, input backgrounds |
| `--color-text` | `#4A4540` | Primary text |
| `--color-text-muted` | `#8A837A` | Secondary text |
| `--color-text-soft` | `#A39E96` | Placeholder/tertiary |
| `--color-accent` | `#B8957A` | Warm accent (streaks, tags, fills) |
| `--color-accent-soft` | `#D4B8A0` | Gradient partner for accent |
| `--color-rose` | `#C9A09A` | Secondary accent |
| `--shadow-raised` | `8px 8px 16px #B8B0A6, -8px -8px 16px #FAF8F5` | Cards, primary buttons |
| `--shadow-raised-sm` | `5px 5px 10px #B8B0A6, -5px -5px 10px #FAF8F5` | Tiles, pills, thumbs |
| `--shadow-inset` | `inset 4px 4px 8px #B8B0A6, inset -4px -4px 8px #FAF8F5` | Inputs, active states |
| `--shadow-inset-deep` | `inset 6px 6px 12px #B8B0A6, inset -6px -6px 12px #FAF8F5` | Lock circle, emphasis wells |
| `--radius` 20px / `--radius-sm` 14px | | Cards / small elements |

**Interaction rules:**

- Raised = resting/actionable; inset = active, selected, or input. Buttons press from raised to inset on `:active`. Active nav item and active filter pill are inset.
- Inputs and textareas: `bg-deep` + inset shadow, no borders, no focus rings — a subtle accent-tinted shadow on focus is acceptable.
- Sliders: inset track in `bg-deep`, accent gradient fill, raised circular thumb.
- Bottom nav: raised pill track (`border-radius: 24px`) floating above the bottom edge; 5 items (Home, Check In, Memories, Dates, Settings).
- Typography: system font stack (`-apple-system, "SF Pro Text", "Segoe UI", sans-serif`); page titles 26px/600 with tight tracking; uppercase micro-labels with wide tracking for section headers and tags.
- Layout: single column, `max-w` ≈ 390–430px centered, content bottom padding clearing the floating nav.
- Accessibility floor: text contrast for `--color-text-muted` on `--color-bg` is ~4.5:1; never convey state by shadow alone — pair inset states with a color shift (as the mockup does with `nav-item.active`).

The mockup file stays in `mockups/` as the visual reference.

## Error handling

- API routes already return JSON errors with status codes; the new UI surfaces them as inline text in the neumorphic card (no toast library).
- Check-in submit disables the button while pending; failures show the API error and leave the form intact.

## Testing / verification

- `npm run build` and `npx tsc --noEmit` clean at the end of every stage.
- Stage 3's two-account browser flow is the acceptance test, re-run after Stage 4.
- Migration 008 verified by direct Supabase queries: as partner A with only B submitted <24h ago, `select * from checkins` must not return B's row.

## Explicitly not in this milestone

Date generation UI, weekly recap surfacing, embeddings, nudge delivery, memory confirmation flow, data-export changes, dark mode, deployment (Vercel) setup.
