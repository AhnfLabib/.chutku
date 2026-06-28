create table checkin_prompts (
  id          uuid primary key default uuid_generate_v4(),
  prompt_text text not null,
  active      boolean default true,
  created_at  timestamptz default now()
);

create table checkins (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id      uuid not null references profiles(id),
  prompt_id    uuid not null references checkin_prompts(id),
  checkin_date date not null,
  mood         smallint check (mood between 1 and 10),
  energy       smallint check (energy between 1 and 10),
  stress       smallint check (stress between 1 and 10),
  closeness    smallint check (closeness between 1 and 10),
  free_text    text,
  submitted_at timestamptz default now(),
  unique(workspace_id, user_id, checkin_date)
);

-- Summary generated when both submit or after 24hr late-submit
create table checkin_summaries (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  checkin_date date not null,
  summary_text text not null,
  generated_at timestamptz default now(),
  unique(workspace_id, checkin_date)
);

create table checkin_streaks (
  workspace_id    uuid primary key references workspaces(id) on delete cascade,
  current_streak  integer default 0,
  longest_streak  integer default 0,
  last_both_date  date
);

create index checkins_workspace_date_idx on checkins(workspace_id, checkin_date);

-- Seed default prompts
insert into checkin_prompts (prompt_text) values
  ('What is one thing you appreciated today?'),
  ('How emotionally available do you feel today?'),
  ('What do you need more of from me this week?'),
  ('What kind of date would feel best right now?'),
  ('What made you smile today?'),
  ('What is one thing that stressed you out today?'),
  ('What is something you''re looking forward to together?'),
  ('How supported do you feel right now?'),
  ('What is one thing you love about our relationship?'),
  ('What is one small thing I could do to make your day better?'),
  ('What are you grateful for today?'),
  ('What has been on your mind lately?'),
  ('How connected do you feel to me today?'),
  ('What is something you want to share with me that you haven''t yet?'),
  ('What is one goal you have for us this month?'),
  ('What moment from this week stands out for you?'),
  ('What does your ideal weekend look like right now?'),
  ('What is something you''re proud of lately?'),
  ('What would help you feel more relaxed tonight?'),
  ('How are you really doing?');
