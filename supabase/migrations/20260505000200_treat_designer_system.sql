alter table public.products
add column if not exists min_quantity integer not null default 6,
add column if not exists image text,
add column if not exists treat_designer_enabled boolean not null default false,
add column if not exists treat_designer_featured boolean not null default false;

create table if not exists public.option_groups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  required boolean not null default false,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.option_groups (id) on delete cascade,
  name text not null,
  price_modifier numeric(10, 2) not null default 0,
  image text,
  color_hex text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.add_ons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10, 2) not null default 0,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.treat_designer_orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete set null,
  selected_options jsonb not null default '[]'::jsonb,
  add_ons jsonb not null default '[]'::jsonb,
  quantity integer not null,
  custom_notes text,
  total_price numeric(10, 2) not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_option_groups_updated_at on public.option_groups;
create trigger set_option_groups_updated_at
before update on public.option_groups
for each row execute function public.set_updated_at();

drop trigger if exists set_options_updated_at on public.options;
create trigger set_options_updated_at
before update on public.options
for each row execute function public.set_updated_at();

drop trigger if exists set_add_ons_updated_at on public.add_ons;
create trigger set_add_ons_updated_at
before update on public.add_ons
for each row execute function public.set_updated_at();

alter table public.option_groups enable row level security;
alter table public.options enable row level security;
alter table public.add_ons enable row level security;
alter table public.treat_designer_orders enable row level security;

drop policy if exists "option groups public read" on public.option_groups;
create policy "option groups public read"
on public.option_groups for select
using (active = true or public.has_role(array['admin', 'staff']));

drop policy if exists "option groups admin manage" on public.option_groups;
create policy "option groups admin manage"
on public.option_groups for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "options public read" on public.options;
create policy "options public read"
on public.options for select
using (active = true or public.has_role(array['admin', 'staff']));

drop policy if exists "options admin manage" on public.options;
create policy "options admin manage"
on public.options for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "add ons public read" on public.add_ons;
create policy "add ons public read"
on public.add_ons for select
using (active = true or public.has_role(array['admin', 'staff']));

drop policy if exists "add ons admin manage" on public.add_ons;
create policy "add ons admin manage"
on public.add_ons for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "treat designer orders public insert" on public.treat_designer_orders;
create policy "treat designer orders public insert"
on public.treat_designer_orders for insert
with check (true);

drop policy if exists "treat designer orders admin read" on public.treat_designer_orders;
create policy "treat designer orders admin read"
on public.treat_designer_orders for select
using (public.has_role(array['admin', 'staff']));
