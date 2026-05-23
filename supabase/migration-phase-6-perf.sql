-- ============================================================
-- Phase 6: Performance Indexes for Production
-- ============================================================

-- Quotations: common filter by lead + status
create index if not exists idx_quotations_lead_status
  on public.quotations(lead_id, status);

-- Invoices: payment collection view (filter by status + date)
create index if not exists idx_invoices_status_due
  on public.invoices(status, due_date);

-- Leads: WhatsApp webhook phone lookup
create index if not exists idx_leads_phone
  on public.leads(phone);

-- Site visits: upcoming visits for an agent
create index if not exists idx_site_visits_agent_scheduled
  on public.site_visits(agent_id, scheduled_at)
  where status = 'Scheduled';

-- Analytics: speed up monthly revenue aggregation
create index if not exists idx_invoices_created_month
  on public.invoices(date_trunc('month', created_at));

-- Slabs: filter by warehouse + status (inventory view)
create index if not exists idx_slabs_warehouse_status
  on public.slabs(warehouse_location, status);

-- Activities: filter by lead (activity timeline)
create index if not exists idx_lead_activities_lead_date
  on public.lead_activities(lead_id, created_at desc);

-- Agent locations: recent locations per agent
create index if not exists idx_agent_locations_agent_recent
  on public.agent_locations(agent_id, recorded_at desc);
