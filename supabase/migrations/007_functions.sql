-- Semantic search over confirmed shared memories only (private_memories excluded by table scope)
create or replace function search_memories(
  query_embedding vector(1536),
  workspace_id_input uuid,
  match_count int default 5
)
returns table (id uuid, title text, content text, tags text[], similarity float)
language sql stable as $$
  select id, title, content, tags,
         1 - (embedding <=> query_embedding) as similarity
  from memories
  where workspace_id = workspace_id_input
    and confirmed = true
    and embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Update streak after both partners submit on a given date
create or replace function update_checkin_streak(ws_id uuid, check_date date)
returns void language plpgsql as $$
declare
  both_submitted boolean;
  yesterday      date := check_date - interval '1 day';
  current_val    integer;
  longest_val    integer;
begin
  select count(*) = 2 into both_submitted
  from checkins
  where workspace_id = ws_id and checkin_date = check_date;

  if not both_submitted then return; end if;

  select current_streak, longest_streak into current_val, longest_val
  from checkin_streaks
  where workspace_id = ws_id;

  if current_val is null then
    insert into checkin_streaks(workspace_id, current_streak, longest_streak, last_both_date)
    values (ws_id, 1, 1, check_date);
  else
    if exists (
      select 1 from checkins
      where workspace_id = ws_id and checkin_date = yesterday
      group by checkin_date having count(*) = 2
    ) then
      update checkin_streaks
      set current_streak = current_streak + 1,
          longest_streak = greatest(longest_streak, current_streak + 1),
          last_both_date = check_date
      where workspace_id = ws_id;
    else
      update checkin_streaks
      set current_streak = 1,
          last_both_date = check_date
      where workspace_id = ws_id;
    end if;
  end if;
end;
$$;

-- Derive today's prompt index from workspace_id hash + day-of-year (deterministic)
create or replace function get_daily_prompt(ws_id uuid, for_date date)
returns uuid language sql stable as $$
  select id from checkin_prompts
  where active = true
  order by id
  offset (
    abs(hashtext(ws_id::text)) + extract(doy from for_date)::int
  ) % (select count(*) from checkin_prompts where active = true)
  limit 1;
$$;
