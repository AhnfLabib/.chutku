create table date_plans (
  id             uuid primary key default uuid_generate_v4(),
  workspace_id   uuid not null references workspaces(id) on delete cascade,
  created_by     uuid not null references profiles(id),
  title          text not null,
  description    text,
  category       text,
  estimated_cost text,
  duration       text,
  scheduled_for  date,
  status         text check (status in ('idea', 'planned', 'completed')) default 'idea',
  source         text check (source in ('ai_generated', 'manual')) default 'manual',
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index date_plans_workspace_idx on date_plans(workspace_id, status);
create index date_plans_scheduled_idx on date_plans(workspace_id, scheduled_for);

create trigger date_plans_updated_at
  before update on date_plans
  for each row execute function update_updated_at();
