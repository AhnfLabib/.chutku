-- Workspaces: one per couple
create table workspaces (
  id         uuid primary key default uuid_generate_v4(),
  name       text,
  created_at timestamptz default now()
);

-- Profiles extend auth.users
create table profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  workspace_id        uuid references workspaces(id),
  display_name        text not null,
  avatar_url          text,
  onboarding_complete boolean default false,
  role                text check (role in ('initiator', 'partner')) default 'initiator',
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Invite tokens: 72hr, single-use
create table invite_tokens (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  created_by   uuid not null references profiles(id),
  token        text not null unique,
  expires_at   timestamptz not null,
  used_at      timestamptz,
  used_by      uuid references profiles(id),
  created_at   timestamptz default now()
);

-- Onboarding questionnaire answers (5 fixed questions)
create table questionnaire_answers (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id      uuid not null references profiles(id),
  question_key text not null,
  answer       text not null,
  created_at   timestamptz default now(),
  unique(workspace_id, user_id, question_key)
);

-- Auto-update updated_at on profiles
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();
