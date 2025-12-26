-- Create Agents Table
create table if not exists public.agents (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  role text not null, -- e.g., 'sales', 'support'
  status text not null default 'active', -- 'active', 'inactive'
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint agents_pkey primary key (id)
);

-- Enable RLS
alter table public.agents enable row level security;

-- Policies
create policy "Users can view their own agents" on public.agents
  for select using ((select auth.uid()) = user_id);

create policy "Users can insert their own agents" on public.agents
  for insert with check ((select auth.uid()) = user_id);

create policy "Users can update their own agents" on public.agents
  for update using ((select auth.uid()) = user_id);

create policy "Users can delete their own agents" on public.agents
  for delete using ((select auth.uid()) = user_id);
