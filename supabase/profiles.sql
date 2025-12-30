-- 1. ANALYTICS EVENTS (Safe update)
create table if not exists public.analytics_events (
  id uuid not null default gen_random_uuid (),
  event_type text not null,
  session_id text null,
  user_id uuid null references auth.users (id),
  agent_id text null,
  website_url text null,
  metadata jsonb null,
  created_at timestamp with time zone not null default now(),
  constraint analytics_events_pkey primary key (id)
);

alter table public.analytics_events enable row level security;

-- Drop policies if they exist to avoid errors
drop policy if exists "Enable insert for authenticated users only" on "public"."analytics_events";
drop policy if exists "Enable insert for anon users" on "public"."analytics_events";

create policy "Enable insert for authenticated users only" on "public"."analytics_events"
  as permissive for insert to authenticated with check (true);

create policy "Enable insert for anon users" on "public"."analytics_events"
  as permissive for insert to anon with check (true);


-- 2. PROFILES TABLE (Merged Onboarding + Stripe)
-- We drop the table to ensure a clean slate for the merged schema
drop table if exists public.profiles cascade;

create table public.profiles (
  id uuid references auth.users (id) on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  
  -- Onboarding Fields
  website_url text,
  domain_occupation text,
  project_idea text,
  referral_source text,
  onboarding_answers jsonb,
  
  -- Stripe Fields
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_tier text default 'free' check (plan_tier in ('free', 'pro')),
  subscription_status text check (subscription_status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  current_period_end timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check ((select auth.uid()) = id);

create policy "Users can update own profile." on public.profiles
  for update using ((select auth.uid()) = id);

-- 3. TRIGGERS
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid error
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
