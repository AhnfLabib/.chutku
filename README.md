# .chtku

A private space for two — daily check-ins, shared memories, and AI-powered date planning, just for you and your partner.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase Postgres + pgvector
- **Auth:** Supabase Auth (magic link)
- **AI:** Anthropic Claude (Haiku for check-in summaries, date ideas)
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
ANTHROPIC_API_KEY=your-anthropic-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Apply database migrations

Run the 7 migrations against your Supabase project in order:

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
```

### 4. Run

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

### Phase 2 — Core (in progress)
- Shared memory CRUD with tags and semantic search
- Daily check-in (mood, energy, stress, closeness + free text)
- 24hr partner reveal with AI-generated summary
- Streak tracking
- Dashboard with priority items

### Phase 3 — AI Features (planned)
- AI-powered date idea generation
- Memory confirmation flow for AI suggestions
- Weekly recap via Edge Function cron
- Data export (JSON)

## Project Structure

```
src/
  app/
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
  components/layout/      — AppNav, AppShell
  lib/
    supabase/             — browser + server clients
    anthropic.ts          — Claude client + context builder
    prompts/              — checkin, dates prompt templates
  types/index.ts          — all DB + app types
supabase/
  migrations/             — 7 ordered SQL migrations
  functions/
    checkin-nudge/        — 20hr nudge cron (Edge Function)
    weekly-recap/         — Sunday recap cron (Edge Function)
```

## Key Design Decisions

**Private memories are structurally isolated.** The `private_memories` table has no `embedding` column and is never touched by `buildCoupleContext()` — AI context leakage is impossible at the schema level, not just by policy.

**Workspace ID always resolves server-side.** Every API route derives `workspace_id` from the authenticated session, never from request body. The `get_my_workspace_id()` Postgres function backs all RLS policies.

**Check-in unlock is time-based.** Partner B's response is revealed 24 hours after Partner A submits, or immediately if both have submitted — whichever comes first.

**Daily prompt is deterministic.** Both partners always see the same prompt for a given day, derived from `hash(workspace_id) + day_of_year mod prompt_count`. No state needed.
