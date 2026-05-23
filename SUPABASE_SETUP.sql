create extension if not exists pgcrypto;

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  email text unique,
  phone text,
  status text not null default 'Offline' check (status in ('Active', 'Offline')),
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'agent' check (role in ('admin', 'agent')),
  agent_id uuid unique references public.agents(id) on delete set null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  marble_type text,
  quantity text,
  site_location text,
  status text not null default 'New' check (status in ('New', 'Contacted', 'Converted', 'Lost')),
  assigned_to uuid references public.agents(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_locations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  address text,
  recorded_at timestamptz not null default now()
);

alter table public.agents add column if not exists user_id uuid unique references auth.users(id) on delete set null;
alter table public.leads add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.user_profiles add column if not exists full_name text;

alter table public.leads alter column created_by set default auth.uid();

create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_assigned_to on public.leads(assigned_to);
create index if not exists idx_leads_created_at on public.leads(created_at desc);
create index if not exists idx_leads_created_by on public.leads(created_by);
create index if not exists idx_agent_locations_agent_time on public.agent_locations(agent_id, recorded_at desc);
create index if not exists idx_agents_user_id on public.agents(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select up.role from public.user_profiles up where up.id = auth.uid() limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, role)
  values (new.id, 'agent')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_agents_updated_at on public.agents;
create trigger trg_agents_updated_at
before update on public.agents
for each row
execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.user_profiles;
create trigger trg_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_leads_updated_at on public.leads;
create trigger trg_leads_updated_at
before update on public.leads
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

alter table public.leads enable row level security;
alter table public.agents enable row level security;
alter table public.agent_locations enable row level security;
alter table public.user_profiles enable row level security;

-- LEADS: all authenticated users can view, insert, and update leads (team-wide CRM)
create policy "Team can view leads" on public.leads for select to authenticated using (true);
create policy "Team can insert leads" on public.leads for insert to authenticated with check (true);
create policy "Team can update leads" on public.leads for update to authenticated using (true) with check (true);

-- AGENTS: all can view; only admins can insert/update
create policy "Team can view agents" on public.agents for select to authenticated using (true);
create policy "Admins can insert agents" on public.agents for insert to authenticated with check (public.is_admin());
create policy "Admins can update agents" on public.agents for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- LOCATIONS: all authenticated users can view and insert
create policy "Team can view locations" on public.agent_locations for select to authenticated using (true);
create policy "Team can insert locations" on public.agent_locations for insert to authenticated with check (true);

-- USER PROFILES: user reads own; admin manages all
create policy "Users read own profile" on public.user_profiles for select to authenticated using (id = auth.uid());
create policy "Admins manage profiles" on public.user_profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
