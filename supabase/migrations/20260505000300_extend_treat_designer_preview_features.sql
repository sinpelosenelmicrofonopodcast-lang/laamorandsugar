alter table public.products
add column if not exists enable_sprinkles boolean not null default false,
add column if not exists enable_logo_upload boolean not null default false,
add column if not exists enable_live_preview boolean not null default true,
add column if not exists logo_upload_fee numeric(10, 2) not null default 0;

create table if not exists public.sprinkle_sets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text,
  color_hex text,
  price_modifier numeric(10, 2) not null default 0,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.treat_designer_orders
add column if not exists config jsonb,
add column if not exists preview_image_url text;

drop trigger if exists set_sprinkle_sets_updated_at on public.sprinkle_sets;
create trigger set_sprinkle_sets_updated_at
before update on public.sprinkle_sets
for each row execute function public.set_updated_at();

alter table public.sprinkle_sets enable row level security;

drop policy if exists "sprinkle sets public read" on public.sprinkle_sets;
create policy "sprinkle sets public read"
on public.sprinkle_sets for select
using (active = true or public.has_role(array['admin', 'staff']));

drop policy if exists "sprinkle sets admin manage" on public.sprinkle_sets;
create policy "sprinkle sets admin manage"
on public.sprinkle_sets for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));
