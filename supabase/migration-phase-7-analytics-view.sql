-- ============================================================
-- Phase 7: Analytics Materialized View (P3 — Long-term perf)
-- ============================================================

-- Fast monthly revenue aggregation
create materialized view if not exists public.mv_monthly_revenue as
select
  date_trunc('month', created_at) as month,
  count(*) as total_invoices,
  coalesce(sum(total_amount), 0) as revenue,
  coalesce(sum(amount_paid), 0) as collected
from public.invoices
group by date_trunc('month', created_at)
order by month desc;

create unique index if not exists idx_mv_monthly_revenue_unique on public.mv_monthly_revenue(month);

-- Fast lead source distribution
create materialized view if not exists public.mv_lead_sources as
select
  lead_source,
  count(*) as total,
  count(*) filter (where status = 'Converted') as converted
from public.leads
where lead_source is not null
group by lead_source
order by total desc;

create unique index if not exists idx_mv_lead_sources_unique on public.mv_lead_sources(lead_source);

-- Refresh function (call via pg_cron or scheduled edge function)
create or replace function public.refresh_analytics_views()
returns void
language sql
as $$
  refresh materialized view concurrently public.mv_monthly_revenue;
  refresh materialized view concurrently public.mv_lead_sources;
$$;
