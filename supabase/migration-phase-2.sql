-- ============================================================
-- Phase 2: Enterprise CRM Database Migration
-- ============================================================

-- 1. Extend user_profiles for RBAC
alter table public.user_profiles add column if not exists role_id uuid references public.roles(id) on delete set null;

-- 2. Roles table
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  hierarchy_level int not null,
  created_at timestamptz not null default now()
);

insert into public.roles (name, hierarchy_level) values
  ('super_admin', 1),
  ('director', 2),
  ('sales_manager', 3),
  ('sales_executive', 4),
  ('marketing', 5),
  ('accountant', 6),
  ('warehouse', 7)
on conflict (name) do nothing;

-- 3. Permissions table
create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  resource text not null,
  action text not null,
  description text,
  unique(resource, action)
);

-- 4. Role-permissions mapping
create table if not exists public.role_permissions (
  role_id uuid references public.roles(id) on delete cascade,
  permission_id uuid references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- 5. Extend leads table
alter table public.leads add column if not exists deal_value numeric(12,2);
alter table public.leads add column if not exists probability smallint default 0;
alter table public.leads add column if not exists lead_score smallint default 0;
alter table public.leads add column if not exists lead_source text;
alter table public.leads add column if not exists pipeline_stage text default 'New';
alter table public.leads add column if not exists follow_up_at timestamptz;
alter table public.leads add column if not exists contact_person text;
alter table public.leads add column if not exists company text;
alter table public.leads add column if not exists email text;
alter table public.leads add column if not exists city text;
alter table public.leads add column if not exists state text;
alter table public.leads add column if not exists pincode text;
alter table public.leads add column if not exists notes text;
alter table public.leads add column if not exists last_contacted_at timestamptz;

-- Pipeline stage check constraint
alter table public.leads drop constraint if exists leads_pipeline_stage_check;
alter table public.leads add constraint leads_pipeline_stage_check
  check (pipeline_stage in ('New', 'Interested', 'Site Visit', 'Quotation Sent', 'Negotiation', 'Converted', 'Lost'));

-- 6. Lead activities
create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  activity_type text not null,
  description text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_lead_activities_lead on public.lead_activities(lead_id, created_at desc);

-- 7. Lead attachments
create table if not exists public.lead_attachments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  file_size int not null,
  storage_path text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 8. Follow-ups / reminders
create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz not null,
  completed_at timestamptz,
  notification_sent boolean default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_follow_ups_due on public.follow_ups(due_at) where completed_at is null;

-- 9. Quotations
create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  quotation_number text unique not null,
  lead_id uuid references public.leads(id) on delete set null,
  agent_id uuid references public.agents(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  customer_address text,
  items jsonb not null,
  subtotal numeric(12,2) not null,
  gst_rate numeric(5,2) default 18.00,
  gst_amount numeric(12,2),
  total_amount numeric(12,2) not null,
  status text not null default 'Draft' check (status in ('Draft','Sent','Approved','Rejected','Converted')),
  valid_until date,
  notes text,
  pdf_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_quotations_lead on public.quotations(lead_id);
create index if not exists idx_quotations_number on public.quotations(quotation_number);

-- 10. Invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  quotation_id uuid references public.quotations(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  gst_number text,
  items jsonb not null,
  subtotal numeric(12,2) not null,
  gst_rate numeric(5,2) default 18.00,
  gst_amount numeric(12,2),
  total_amount numeric(12,2) not null,
  amount_paid numeric(12,2) default 0,
  balance_due numeric(12,2),
  status text not null default 'Unpaid' check (status in ('Unpaid','Paid','Partially Paid','Overdue','Cancelled')),
  due_date date,
  pdf_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_invoices_number on public.invoices(invoice_number);

-- 11. Inventory
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  marble_type text not null,
  color text,
  finish text,
  thickness numeric(5,2),
  size text,
  quantity_available numeric(10,2) not null default 0,
  unit text not null default 'sqft',
  unit_price numeric(12,2),
  location text,
  supplier text,
  min_stock_level numeric(10,2) default 0,
  status text not null default 'In Stock' check (status in ('In Stock','Low Stock','Out of Stock','Discontinued')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 12. Stock movements
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  movement_type text not null check (movement_type in ('in','out','adjustment','return')),
  quantity numeric(10,2) not null,
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 13. Audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource text not null,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_logs_resource on public.audit_logs(resource, resource_id);
create index if not exists idx_audit_logs_user on public.audit_logs(user_id);
create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);

-- 14. WhatsApp messages
create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  agent_id uuid references public.agents(id) on delete set null,
  direction text not null check (direction in ('outbound','inbound')),
  message_type text not null default 'text' check (message_type in ('text','template','image','document')),
  content text not null,
  media_url text,
  status text not null default 'sent' check (status in ('sent','delivered','read','failed')),
  whatsapp_message_id text,
  created_at timestamptz not null default now()
);

-- 15. Workflow automation rules
create table if not exists public.workflow_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trigger_event text not null,
  conditions jsonb,
  actions jsonb not null,
  is_active boolean default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 16. Field check-ins
create table if not exists public.field_checkins (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  type text not null check (type in ('checkin','checkout')),
  latitude double precision not null,
  longitude double precision not null,
  address text,
  notes text,
  created_at timestamptz not null default now()
);

-- 17. Geofences
create table if not exists public.geofences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  radius_meters numeric(10,2) not null,
  agent_id uuid references public.agents(id) on delete cascade,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

-- 18. Triggers for updated_at
drop trigger if exists trg_quotations_updated_at on public.quotations;
create trigger trg_quotations_updated_at
before update on public.quotations
for each row execute function public.set_updated_at();

drop trigger if exists trg_invoices_updated_at on public.invoices;
create trigger trg_invoices_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

drop trigger if exists trg_inventory_updated_at on public.inventory_items;
create trigger trg_inventory_updated_at
before update on public.inventory_items
for each row execute function public.set_updated_at();

-- 19. FTS Index for leads
create index if not exists idx_leads_name_fts on public.leads
  using gin(to_tsvector('english', coalesce(name,'') || ' ' || coalesce(phone,'') || ' ' || coalesce(marble_type,'') || ' ' || coalesce(site_location,'')));

-- 20. Audit trigger function
create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (user_id, action, resource, resource_id, new_values)
    values (auth.uid(), 'create', tg_table_name::text, new.id, row_to_json(new)::jsonb);
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.audit_logs (user_id, action, resource, resource_id, old_values, new_values)
    values (auth.uid(), 'update', tg_table_name::text, new.id, row_to_json(old)::jsonb, row_to_json(new)::jsonb);
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.audit_logs (user_id, action, resource, resource_id, old_values)
    values (auth.uid(), 'delete', tg_table_name::text, old.id, row_to_json(old)::jsonb);
    return old;
  end if;
end;
$$;

-- Enable audit on critical tables
create trigger audit_leads after insert or update or delete on public.leads
  for each row execute function public.audit_trigger();
create trigger audit_agents after insert or update or delete on public.agents
  for each row execute function public.audit_trigger();
create trigger audit_quotations after insert or update or delete on public.quotations
  for each row execute function public.audit_trigger();
create trigger audit_invoices after insert or update or delete on public.invoices
  for each row execute function public.audit_trigger();

-- 21. has_permission helper function
create or replace function public.has_permission(req_resource text, req_action text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles up
    join public.role_permissions rp on rp.role_id = up.role_id
    join public.permissions p on p.id = rp.permission_id
    where up.id = auth.uid()
      and (p.resource = req_resource and (p.action = req_action or p.action = 'manage'))
  );
$$;

-- 22. Pipeline stage helper
create or replace function public.get_next_pipeline_stage(current_stage text)
returns text
language sql
immutable
as $$
  select case current_stage
    when 'New' then 'Interested'
    when 'Interested' then 'Site Visit'
    when 'Site Visit' then 'Quotation Sent'
    when 'Quotation Sent' then 'Negotiation'
    when 'Negotiation' then 'Converted'
    when 'Converted' then 'Converted'
    when 'Lost' then 'Lost'
    else 'New'
  end;
$$;

-- RLS for new tables
alter table public.lead_activities enable row level security;
alter table public.quotations enable row level security;
alter table public.invoices enable row level security;
alter table public.inventory_items enable row level security;
alter table public.follow_ups enable row level security;
alter table public.audit_logs enable row level security;

create policy "Team can view activities" on public.lead_activities for select to authenticated using (true);
create policy "Team can insert activities" on public.lead_activities for insert to authenticated with check (true);
create policy "Team can view quotations" on public.quotations for select to authenticated using (true);
create policy "Team can insert quotations" on public.quotations for insert to authenticated with check (true);
create policy "Team can update quotations" on public.quotations for update to authenticated using (true) with check (true);
create policy "Team can view invoices" on public.invoices for select to authenticated using (true);
create policy "Team can view inventory" on public.inventory_items for select to authenticated using (true);
create policy "Team can view followups" on public.follow_ups for select to authenticated using (true);
create policy "Team can insert followups" on public.follow_ups for insert to authenticated with check (true);
create policy "Audit log read by admins" on public.audit_logs for select to authenticated using (public.is_admin());

select 'Phase 2 migration complete' as status;
