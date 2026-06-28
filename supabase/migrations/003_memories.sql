-- Shared memories (AI-accessible, semantic search)
create table memories (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  created_by   uuid not null references profiles(id),
  title        text not null,
  content      text not null,
  tags         text[] default '{}',
  source       text check (source in ('manual', 'ai_suggested', 'onboarding')) default 'manual',
  confirmed    boolean default true,
  embedding    vector(1536),
  memory_date  date,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Private memories: owner-only, intentionally NO embedding column
create table private_memories (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  owner_id     uuid not null references profiles(id),
  title        text not null,
  content      text not null,
  tags         text[] default '{}',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index memories_workspace_idx on memories(workspace_id);
create index memories_confirmed_idx on memories(workspace_id, confirmed);
create index memories_embedding_idx on memories using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create trigger memories_updated_at
  before update on memories
  for each row execute function update_updated_at();

create trigger private_memories_updated_at
  before update on private_memories
  for each row execute function update_updated_at();
