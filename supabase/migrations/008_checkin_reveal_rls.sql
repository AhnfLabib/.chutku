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
