# .chtku

A private space for two — daily check-ins, shared memories, and AI-powered date planning, just for you and your partner.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase Postgres + pgvector
- **Auth:** Supabase Auth (magic link)
- **AI:** Ollama (local, free) — check-in summaries, date ideas; template fallback if Ollama is offline
- **Styling:** Tailwind CSS v4

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/ahnflabib/.chutku
cd .chutku
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Local AI (Ollama) — https://ollama.com
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Apply database migrations

Run all 8 migrations against your Supabase project in order:

```bash
npx supabase db push
```

Or paste them manually into the Supabase SQL editor:

```
supabase/migrations/
  001_extensions.sql    — uuid-ossp + pgvector
  002_core_tables.sql   — workspaces, profiles, invite_tokens
  003_memories.sql      — shared memories (pgvector), private memories
  004_checkins.sql      — check-in prompts, responses, summaries, streaks
  005_dates.sql         — date plans
  006_rls.sql           — row-level security policies
  007_functions.sql     — search_memories(), update_checkin_streak(), get_daily_prompt()
  008_checkin_reveal_rls.sql — 24hr partner reveal enforced in RLS
```

### 4. Install Ollama (local AI)

```bash
# https://ollama.com — then pull a model:
ollama pull llama3.2:3b
```

Summaries use Ollama when it's running. If Ollama is offline, check-in summaries fall back to a simple template.

### 5. Run

```bash
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## Features

### Phase 1 — Foundation ✅
- Magic link auth
- Workspace-per-couple isolation
- Partner invite (72hr single-use link)
- 3-step onboarding with 5-question questionnaire → auto-seeds shared memories

### Phase 2 — Core ✅
- Shared memory CRUD with tags and tag filtering (semantic search deferred — needs embeddings provider)
- Daily check-in UI (mood, energy, stress, closeness + free text)
- 24hr partner reveal with AI-generated summary
- Streak tracking
- Dashboard with priority items, streak card, and today's summary

### Phase 3 — AI Features (planned)
- AI-powered date idea generation (API exists; UI pending)
- Memory confirmation flow for AI suggestions
- Weekly recap via Edge Function cron

## Project Structure

```
src/
  app/
    layout.tsx            — root layout + globals.css
    globals.css           — Tailwind v4 + Neumorphism design tokens
    (auth)/login/         — magic link login
    onboarding/           — 3-step onboarding flow
    invite/[token]/       — partner accept page
    (app)/                — authenticated app shell
      dashboard/
      checkin/
      memories/
      dates/
      settings/
    api/                  — all API routes
  components/layout/      — AppNav
  lib/
    supabase/             — browser + server clients
    dashboard.ts          — shared dashboard data helper
    ai.ts                 — Ollama client + couple context builder
    prompts/              — checkin, dates prompt templates
  types/index.ts          — all DB + app types
supabase/
  migrations/             — 8 ordered SQL migrations
  functions/
    checkin-nudge/        — 20hr nudge cron (Edge Function)
    weekly-recap/         — Sunday recap cron (Edge Function)
mockups/
  neumorphism-preview.html — visual reference for the UI system
```

## Key Design Decisions

**Private memories are structurally isolated.** The `private_memories` table has no `embedding` column and is never touched by `buildCoupleContext()` — AI context leakage is impossible at the schema level, not just by policy.

**Workspace ID always resolves server-side.** Every API route derives `workspace_id` from the authenticated session, never from request body. The `get_my_workspace_id()` Postgres function backs all RLS policies.

**Check-in unlock is time-based and enforced in RLS.** Partner B's response is revealed 24 hours after Partner A submits, or immediately if both have submitted — whichever comes first. Migration `008_checkin_reveal_rls.sql` enforces this at the database level (not just in the API route).

**Daily prompt is deterministic.** Both partners always see the same prompt for a given day, derived from `hash(workspace_id) + day_of_year mod prompt_count`. No state needed.

## Design

The UI uses a **Neumorphism** system: warm stone palette (`#E8E4DF`), dual shadows for depth (raised = actionable, inset = active/input), no borders. Design tokens live in `src/app/globals.css` (`@theme` block). Visual reference: `mockups/neumorphism-preview.html`.
