-- ============================================================
-- Phase 3: Row-Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
alter table public.agents enable row level security;
alter table public.user_profiles enable row level security;
alter table public.leads enable row level security;
alter table public.agent_locations enable row level security;
alter table public.lead_activities enable row level security;
alter table public.lead_attachments enable row level security;
alter table public.follow_ups enable row level security;
alter table public.quotations enable row level security;
alter table public.invoices enable row level security;
alter table public.inventory_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.audit_logs enable row level security;
alter table public.whatsapp_messages enable row level security;
alter table public.workflow_rules enable row level security;
alter table public.field_checkins enable row level security;
alter table public.geofences enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

-- ============================================================
-- Agents: Admins full access, agents read own
-- ============================================================
create policy "Admins can manage agents" on public.agents
  for all using (public.is_admin());

create policy "Agents can read own profile" on public.agents
  for select using (auth.uid() = user_id);

-- ============================================================
-- User Profiles: Admins full access, users read own
-- ============================================================
create policy "Admins can manage user_profiles" on public.user_profiles
  for all using (public.is_admin());

create policy "Users can read own profile" on public.user_profiles
  for select using (auth.uid() = id);

-- ============================================================
-- Leads: Admins full access, agents read assigned & own created
-- ============================================================
create policy "Admins can manage leads" on public.leads
  for all using (public.is_admin());

create policy "Agents can read assigned leads" on public.leads
  for select using (
    auth.uid() = assigned_to
    or auth.uid() = created_by
  );

create policy "Agents can create leads" on public.leads
  for insert with check (true);

create policy "Agents can update assigned leads" on public.leads
  for update using (
    auth.uid() = assigned_to
    or auth.uid() = created_by
    or public.is_admin()
  );

-- ============================================================
-- Agent Locations: Admins all, agents manage own
-- ============================================================
create policy "Admins can manage agent_locations" on public.agent_locations
  for all using (public.is_admin());

create policy "Agents can insert own locations" on public.agent_locations
  for insert with check (
    exists (
      select 1 from public.agents
      where agents.id = agent_id
      and agents.user_id = auth.uid()
    )
  );

create policy "Agents can read own locations" on public.agent_locations
  for select using (
    exists (
      select 1 from public.agents
      where agents.id = agent_id
      and agents.user_id = auth.uid()
    )
  );

-- ============================================================
-- Lead Activities: Authenticated users can read
-- ============================================================
create policy "Authenticated can read lead_activities" on public.lead_activities
  for select using (auth.role() = 'authenticated');

create policy "Authenticated can insert lead_activities" on public.lead_activities
  for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- Lead Attachments: Authenticated users can read, uploaders manage
-- ============================================================
create policy "Authenticated can read attachments" on public.lead_attachments
  for select using (auth.role() = 'authenticated');

create policy "Authenticated can insert attachments" on public.lead_attachments
  for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- Follow-ups: Admins all, agents manage own
-- ============================================================
create policy "Admins can manage follow_ups" on public.follow_ups
  for all using (public.is_admin());

create policy "Agents can read own follow_ups" on public.follow_ups
  for select using (auth.uid() = assigned_to);

create policy "Agents can update own follow_ups" on public.follow_ups
  for update using (auth.uid() = assigned_to);

-- ============================================================
-- Quotations: Admins all, everyone authenticated can read
-- ============================================================
create policy "Admins can manage quotations" on public.quotations
  for all using (public.is_admin());

create policy "Authenticated can read quotations" on public.quotations
  for select using (auth.role() = 'authenticated');

create policy "Authenticated can create quotations" on public.quotations
  for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- Invoices: Admins all, authenticated can read
-- ============================================================
create policy "Admins can manage invoices" on public.invoices
  for all using (public.is_admin());

create policy "Authenticated can read invoices" on public.invoices
  for select using (auth.role() = 'authenticated');

create policy "Authenticated can create invoices" on public.invoices
  for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- Inventory: Admins manage, authenticated read
-- ============================================================
create policy "Admins can manage inventory" on public.inventory_items
  for all using (public.is_admin());

create policy "Authenticated can read inventory" on public.inventory_items
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- Stock Movements: Admins all, authenticated read
-- ============================================================
create policy "Admins can manage stock_movements" on public.stock_movements
  for all using (public.is_admin());

create policy "Authenticated can read stock_movements" on public.stock_movements
  for select using (auth.role() = 'authenticated');

create policy "Authenticated can insert stock_movements" on public.stock_movements
  for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- Audit Logs: Admins only
-- ============================================================
create policy "Admins can read audit_logs" on public.audit_logs
  for select using (public.is_admin());

create policy "System can insert audit_logs" on public.audit_logs
  for insert with check (true);

-- ============================================================
-- WhatsApp Messages: Admins all, agents manage own
-- ============================================================
create policy "Admins can manage whatsapp_messages" on public.whatsapp_messages
  for all using (public.is_admin());

create policy "Agents can read own messages" on public.whatsapp_messages
  for select using (auth.uid() = agent_id);

create policy "Authenticated can send messages" on public.whatsapp_messages
  for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- Workflow Rules: Admins only
-- ============================================================
create policy "Admins can manage workflow_rules" on public.workflow_rules
  for all using (public.is_admin());

-- ============================================================
-- Field Checkins: Admins all, agents manage own
-- ============================================================
create policy "Admins can manage field_checkins" on public.field_checkins
  for all using (public.is_admin());

create policy "Agents can read own checkins" on public.field_checkins
  for select using (
    exists (
      select 1 from public.agents
      where agents.id = agent_id
      and agents.user_id = auth.uid()
    )
  );

create policy "Agents can insert own checkins" on public.field_checkins
  for insert with check (
    exists (
      select 1 from public.agents
      where agents.id = agent_id
      and agents.user_id = auth.uid()
    )
  );

-- ============================================================
-- Geofences: Admins full, agents read
-- ============================================================
create policy "Admins can manage geofences" on public.geofences
  for all using (public.is_admin());

create policy "Authenticated can read geofences" on public.geofences
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- Roles & Permissions: Admins only
-- ============================================================
create policy "Admins can manage roles" on public.roles
  for all using (public.is_admin());

create policy "Authenticated can read roles" on public.roles
  for select using (auth.role() = 'authenticated');

create policy "Admins can manage permissions" on public.permissions
  for all using (public.is_admin());

create policy "Admins can manage role_permissions" on public.role_permissions
  for all using (public.is_admin());

create policy "Authenticated can read role_permissions" on public.role_permissions
  for select using (auth.role() = 'authenticated');
