-- AI memory suggestions: unconfirmed ai_suggested rows must be visible to both
-- partners for review, and dismissable by either partner.

drop policy "workspace memories select" on memories;
create policy "workspace memories select" on memories
  for select using (
    workspace_id = get_my_workspace_id()
    and (confirmed = true or source = 'ai_suggested')
  );

drop policy "workspace memories delete" on memories;
create policy "workspace memories delete" on memories
  for delete using (
    workspace_id = get_my_workspace_id()
    and (created_by = auth.uid() or (source = 'ai_suggested' and confirmed = false))
  );
