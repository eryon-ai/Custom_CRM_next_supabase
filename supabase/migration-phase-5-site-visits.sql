-- ============================================================
-- Phase 5: Site Visits table
-- ============================================================

create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  scheduled_at timestamptz not null,
  actual_at timestamptz,
  status text not null default 'Scheduled'
    check (status in ('Scheduled', 'In Progress', 'Completed', 'Cancelled', 'No Show')),
  outcome text,
  notes text,
  photos text[] default '{}',
  latitude double precision,
  longitude double precision,
  address text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_site_visits_lead on public.site_visits(lead_id);
create index if not exists idx_site_visits_agent on public.site_visits(agent_id);
create index if not exists idx_site_visits_scheduled on public.site_visits(scheduled_at);

alter table public.site_visits enable row level security;

create policy "Admins can manage site_visits" on public.site_visits
  for all using (public.is_admin());

create policy "Authenticated can view site_visits" on public.site_visits
  for select using (auth.role() = 'authenticated');

create policy "Authenticated can create site_visits" on public.site_visits
  for insert with check (auth.role() = 'authenticated');

create policy "Agents can update own visits" on public.site_visits
  for update using (
    exists (
      select 1 from public.agents
      where agents.id = agent_id
      and agents.user_id = auth.uid()
    )
    or public.is_admin()
  );
