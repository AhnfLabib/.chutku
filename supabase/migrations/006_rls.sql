-- Helper: resolves workspace_id for the current user
create or replace function get_my_workspace_id()
returns uuid language sql stable security definer as $$
  select workspace_id from profiles where id = auth.uid()
$$;

-- ── workspaces ──────────────────────────────────────────────────────────────
alter table workspaces enable row level security;
create policy "workspace members only" on workspaces
  for all using (id = get_my_workspace_id());

-- ── profiles ────────────────────────────────────────────────────────────────
alter table profiles enable row level security;
create policy "workspace profiles select" on profiles
  for select using (workspace_id = get_my_workspace_id());
create policy "own profile all" on profiles
  for all using (id = auth.uid());

-- ── invite_tokens ────────────────────────────────────────────────────────────
alter table invite_tokens enable row level security;
create policy "invite token read" on invite_tokens
  for select using (workspace_id = get_my_workspace_id() or created_by = auth.uid());
create policy "invite token insert" on invite_tokens
  for insert with check (created_by = auth.uid());
-- Accept is done via service role in the API route

-- ── questionnaire_answers ────────────────────────────────────────────────────
alter table questionnaire_answers enable row level security;
create policy "workspace questionnaire" on questionnaire_answers
  for all using (workspace_id = get_my_workspace_id());

-- ── memories (shared, confirmed-only read) ───────────────────────────────────
alter table memories enable row level security;
create policy "workspace memories select" on memories
  for select using (workspace_id = get_my_workspace_id() and confirmed = true);
create policy "workspace memories insert" on memories
  for insert with check (workspace_id = get_my_workspace_id() and created_by = auth.uid());
create policy "workspace memories update" on memories
  for update using (workspace_id = get_my_workspace_id());
create policy "workspace memories delete" on memories
  for delete using (workspace_id = get_my_workspace_id() and created_by = auth.uid());

-- ── private_memories (owner only) ────────────────────────────────────────────
alter table private_memories enable row level security;
create policy "private memories owner only" on private_memories
  for all using (owner_id = auth.uid());

-- ── checkin_prompts ──────────────────────────────────────────────────────────
alter table checkin_prompts enable row level security;
create policy "active prompts readable" on checkin_prompts
  for select using (active = true);

-- ── checkins ─────────────────────────────────────────────────────────────────
alter table checkins enable row level security;
create policy "workspace checkins" on checkins
  for all using (workspace_id = get_my_workspace_id());

-- ── checkin_summaries ────────────────────────────────────────────────────────
alter table checkin_summaries enable row level security;
create policy "workspace summaries" on checkin_summaries
  for all using (workspace_id = get_my_workspace_id());

-- ── checkin_streaks ──────────────────────────────────────────────────────────
alter table checkin_streaks enable row level security;
create policy "workspace streaks" on checkin_streaks
  for all using (workspace_id = get_my_workspace_id());

-- ── date_plans ───────────────────────────────────────────────────────────────
alter table date_plans enable row level security;
create policy "workspace date plans" on date_plans
  for all using (workspace_id = get_my_workspace_id());
