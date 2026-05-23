-- ============================================================
-- Phase 4: Slab-Level Inventory — Track Every Marble Slab
-- ============================================================

-- Slabs table: each slab is a unique, individually tracked piece
create table if not exists public.slabs (
  id uuid primary key default gen_random_uuid(),
  slab_code text unique not null,               -- e.g., SLB-2026-0001
  block_id text,                                 -- parent marble block reference
  marble_type text not null,                     -- e.g., 'italian-carrara'
  color_variation text,                          -- e.g., 'White/Light Grey'
  vein_pattern text,                             -- e.g., 'Fine Linear'
  grade text not null default 'Standard',        -- Premium, Standard, Economy
  length_cm numeric(7,2),                       -- length in cm
  width_cm numeric(7,2),                        -- width in cm
  thickness_mm numeric(5,1),                    -- thickness in mm
  area_sqft numeric(8,2),                       -- calculated area in sqft
  weight_kg numeric(8,2),                       -- estimated weight
  purchase_price numeric(12,2),                 -- cost price per slab
  selling_price numeric(12,2),                  -- selling price per slab
  photos text[] default '{}',                   -- array of Supabase Storage URLs
  qr_code text,                                 -- QR code data URL
  warehouse_location text,                      -- e.g., 'Warehouse A - Rack 3 - Shelf 2'
  supplier text,
  batch_number text,
  status text not null default 'Available'       -- Available, Reserved, Sold, Damaged, In Transit
    check (status in ('Available', 'Reserved', 'Sold', 'Damaged', 'In Transit', 'Processing')),
  notes text,
  reserved_for_lead uuid references public.leads(id) on delete set null,
  reserved_at timestamptz,
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_slabs_status on public.slabs(status);
create index if not exists idx_slabs_marble_type on public.slabs(marble_type);
create index if not exists idx_slabs_warehouse on public.slabs(warehouse_location);
create index if not exists idx_slabs_code on public.slabs(slab_code);

-- Marble blocks (parent of slabs)
create table if not exists public.marble_blocks (
  id uuid primary key default gen_random_uuid(),
  block_code text unique not null,               -- e.g., BLK-2026-0001
  marble_type text not null,
  origin text,                                   -- quarry/mine location
  purchase_date date,
  purchase_price numeric(12,2),
  supplier text,
  total_slabs int default 0,
  status text not null default 'In Stock'        -- In Stock, Processing, Completed
    check (status in ('In Stock', 'Processing', 'Completed', 'Sold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_blocks_code on public.marble_blocks(block_code);

-- Slab reservations
create table if not exists public.slab_reservations (
  id uuid primary key default gen_random_uuid(),
  slab_id uuid not null references public.slabs(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  reserved_by uuid references auth.users(id) on delete set null,
  reserved_at timestamptz not null default now(),
  expires_at timestamptz,                        -- auto-release after expiry
  status text not null default 'Active'          -- Active, Released, Converted
    check (status in ('Active', 'Released', 'Converted')),
  notes text
);

create index if not exists idx_slab_reservations_slab on public.slab_reservations(slab_id);
create index if not exists idx_slab_reservations_lead on public.slab_reservations(lead_id);

-- Slab wastage tracking
create table if not exists public.slab_wastage (
  id uuid primary key default gen_random_uuid(),
  slab_id uuid not null references public.slabs(id) on delete cascade,
  usable_area_sqft numeric(7,2) not null,
  waste_area_sqft numeric(7,2) not null,
  waste_percentage numeric(5,2) generated always as (
    round((waste_area_sqft / nullif(usable_area_sqft + waste_area_sqft, 0)) * 100, 2)
  ) stored,
  waste_reason text,                             -- e.g., 'Edge trimming', 'Vein crack', 'Customer cut'
  cutting_job_id uuid,                           -- reference to cutting/production job
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_slab_wastage_slab on public.slab_wastage(slab_id);

-- Enable RLS
alter table public.slabs enable row level security;
alter table public.marble_blocks enable row level security;
alter table public.slab_reservations enable row level security;
alter table public.slab_wastage enable row level security;

-- RLS for slabs
create policy "Admins can manage slabs" on public.slabs
  for all using (public.is_admin());

create policy "Authenticated can view slabs" on public.slabs
  for select using (auth.role() = 'authenticated');

-- RLS for marble blocks
create policy "Admins can manage blocks" on public.marble_blocks
  for all using (public.is_admin());

create policy "Authenticated can view blocks" on public.marble_blocks
  for select using (auth.role() = 'authenticated');

-- RLS for slab reservations
create policy "Admins can manage reservations" on public.slab_reservations
  for all using (public.is_admin());

create policy "Authenticated can view reservations" on public.slab_reservations
  for select using (auth.role() = 'authenticated');

-- RLS for slab wastage
create policy "Admins can manage wastage" on public.slab_wastage
  for all using (public.is_admin());

create policy "Authenticated can view wastage" on public.slab_wastage
  for select using (auth.role() = 'authenticated');

-- Function: Auto-generate slab code
create or replace function public.generate_slab_code()
returns text
language plpgsql
as $$
declare
  year text := to_char(now(), 'YYYY');
  seq int;
begin
  select count(*) + 1 into seq from public.slabs
    where created_at >= date_trunc('year', now());
  return 'SLB-' || year || '-' || lpad(seq::text, 4, '0');
end;
$$;

-- Function: Auto-calculate slab area in sqft
create or replace function public.calculate_slab_area()
returns trigger
language plpgsql
as $$
begin
  if new.length_cm is not null and new.width_cm is not null then
    -- Convert cm² to sqft (1 sqft = 929.0304 cm²)
    new.area_sqft := round((new.length_cm * new.width_cm / 929.0304)::numeric, 2);
  end if;
  return new;
end;
$$;

create trigger trg_calculate_slab_area
  before insert or update on public.slabs
  for each row execute function public.calculate_slab_area();

-- Function: Auto-release expired slab reservations (for cron/scheduler)
create or replace function public.release_expired_reservations()
returns int
language plpgsql
as $$
declare
  released_count int;
begin
  update public.slab_reservations
  set status = 'Released'
  where status = 'Active'
    and expires_at < now();

  get diagnostics released_count = row_count;

  -- Also update slab status back to Available
  update public.slabs
  set status = 'Available', reserved_for_lead = null, reserved_at = null
  where id in (
    select slab_id from public.slab_reservations
    where status = 'Released' and expires_at < now()
  );

  return released_count;
end;
$$;
