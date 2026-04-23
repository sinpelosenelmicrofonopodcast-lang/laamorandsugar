create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  role text not null default 'customer' check (role in ('admin', 'staff', 'customer')),
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.roles
  where user_id = auth.uid()
  limit 1;
$$;

create or replace function public.has_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.roles
    where user_id = auth.uid()
      and role = any(required_roles)
  );
$$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  sku text,
  base_price numeric(10, 2) not null default 0,
  featured boolean not null default false,
  seasonal boolean not null default false,
  stock_quantity integer,
  lead_time_days integer not null default 2,
  status text not null default 'active' check (status in ('active', 'draft', 'archived')),
  pickup_only boolean not null default false,
  delivery_available boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  option_value text not null,
  price_delta numeric(10, 2) not null default 0,
  is_default boolean not null default false,
  stock_quantity integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_addons (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  description text,
  price numeric(10, 2) not null default 0,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10, 2) not null,
  minimum_order_amount numeric(10, 2),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer,
  usage_count integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default concat('LAS-', floor(extract(epoch from now()) * 1000)::bigint),
  user_id uuid references public.profiles (id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'in_progress', 'ready', 'delivered', 'canceled')),
  fulfillment_method text not null check (fulfillment_method in ('pickup', 'delivery')),
  fulfillment_date date not null,
  fulfillment_time_slot text,
  notes text,
  subtotal numeric(10, 2) not null default 0,
  discount_total numeric(10, 2) not null default 0,
  delivery_fee numeric(10, 2) not null default 0,
  tax_total numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  coupon_id uuid references public.coupons (id) on delete set null,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  shipping_address jsonb,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  variant_name text,
  unit_price numeric(10, 2) not null default 0,
  quantity integer not null default 1,
  addons jsonb,
  image_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.custom_orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  email text not null,
  event_type text not null,
  event_date date not null,
  quantity text not null,
  budget numeric(10, 2),
  colors_theme text,
  description text not null,
  inspiration_image_url text,
  notes text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'quoted', 'approved', 'declined', 'completed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  quote text not null,
  occasion text,
  featured boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.homepage_content (
  id uuid primary key default gen_random_uuid(),
  banner_text text,
  banner_cta_label text,
  banner_cta_href text,
  hero_eyebrow text,
  hero_title text,
  hero_description text,
  hero_primary_cta_label text,
  hero_primary_cta_href text,
  hero_secondary_cta_label text,
  hero_secondary_cta_href text,
  featured_heading text,
  featured_description text,
  process_heading text,
  process_description text,
  testimonials_heading text,
  testimonials_description text,
  cta_heading text,
  cta_description text,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.seasonal_specials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  description text,
  cta_label text,
  cta_href text,
  image_url text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint seasonal_specials_date_check check (ends_at >= starts_at)
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  tagline text,
  support_email text,
  support_phone text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  address text,
  business_hours jsonb,
  delivery_zones jsonb,
  pickup_instructions text,
  free_delivery_threshold numeric(10, 2),
  currency text not null default 'USD',
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  storage_path text not null,
  public_url text,
  alt_text text,
  bucket text not null default 'brand-media',
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row execute procedure public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute procedure public.set_updated_at();

drop trigger if exists set_coupons_updated_at on public.coupons;
create trigger set_coupons_updated_at
before update on public.coupons
for each row execute procedure public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute procedure public.set_updated_at();

drop trigger if exists set_custom_orders_updated_at on public.custom_orders;
create trigger set_custom_orders_updated_at
before update on public.custom_orders
for each row execute procedure public.set_updated_at();

drop trigger if exists set_testimonials_updated_at on public.testimonials;
create trigger set_testimonials_updated_at
before update on public.testimonials
for each row execute procedure public.set_updated_at();

drop trigger if exists set_homepage_content_updated_at on public.homepage_content;
create trigger set_homepage_content_updated_at
before update on public.homepage_content
for each row execute procedure public.set_updated_at();

drop trigger if exists set_seasonal_specials_updated_at on public.seasonal_specials;
create trigger set_seasonal_specials_updated_at
before update on public.seasonal_specials
for each row execute procedure public.set_updated_at();

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
before update on public.site_settings
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_addons enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.custom_orders enable row level security;
alter table public.testimonials enable row level security;
alter table public.homepage_content enable row level security;
alter table public.seasonal_specials enable row level security;
alter table public.site_settings enable row level security;
alter table public.media_assets enable row level security;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read"
on public.profiles for select
using (auth.uid() = id or public.has_role(array['admin', 'staff']));

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update"
on public.profiles for update
using (auth.uid() = id or public.has_role(array['admin', 'staff']))
with check (auth.uid() = id or public.has_role(array['admin', 'staff']));

drop policy if exists "roles self read" on public.roles;
create policy "roles self read"
on public.roles for select
using (auth.uid() = user_id or public.has_role(array['admin', 'staff']));

drop policy if exists "roles admin manage" on public.roles;
create policy "roles admin manage"
on public.roles for all
using (public.has_role(array['admin']))
with check (public.has_role(array['admin']));

drop policy if exists "categories public read" on public.categories;
create policy "categories public read"
on public.categories for select
using (true);

drop policy if exists "categories admin manage" on public.categories;
create policy "categories admin manage"
on public.categories for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "products public read" on public.products;
create policy "products public read"
on public.products for select
using (
  (active = true and status = 'active')
  or public.has_role(array['admin', 'staff'])
);

drop policy if exists "products admin manage" on public.products;
create policy "products admin manage"
on public.products for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "product images public read" on public.product_images;
create policy "product images public read"
on public.product_images for select
using (true);

drop policy if exists "product images admin manage" on public.product_images;
create policy "product images admin manage"
on public.product_images for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "product variants public read" on public.product_variants;
create policy "product variants public read"
on public.product_variants for select
using (true);

drop policy if exists "product variants admin manage" on public.product_variants;
create policy "product variants admin manage"
on public.product_variants for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "product addons public read" on public.product_addons;
create policy "product addons public read"
on public.product_addons for select
using (true);

drop policy if exists "product addons admin manage" on public.product_addons;
create policy "product addons admin manage"
on public.product_addons for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "coupons admin manage" on public.coupons;
create policy "coupons admin manage"
on public.coupons for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "orders self read" on public.orders;
create policy "orders self read"
on public.orders for select
using (auth.uid() = user_id or public.has_role(array['admin', 'staff']));

drop policy if exists "orders admin manage" on public.orders;
create policy "orders admin manage"
on public.orders for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "order items self read" on public.order_items;
create policy "order items self read"
on public.order_items for select
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and (orders.user_id = auth.uid() or public.has_role(array['admin', 'staff']))
  )
);

drop policy if exists "order items admin manage" on public.order_items;
create policy "order items admin manage"
on public.order_items for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "custom orders public insert" on public.custom_orders;
create policy "custom orders public insert"
on public.custom_orders for insert
with check (true);

drop policy if exists "custom orders admin manage" on public.custom_orders;
create policy "custom orders admin manage"
on public.custom_orders for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "testimonials public read" on public.testimonials;
create policy "testimonials public read"
on public.testimonials for select
using (true);

drop policy if exists "testimonials admin manage" on public.testimonials;
create policy "testimonials admin manage"
on public.testimonials for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "homepage public read" on public.homepage_content;
create policy "homepage public read"
on public.homepage_content for select
using (true);

drop policy if exists "homepage admin manage" on public.homepage_content;
create policy "homepage admin manage"
on public.homepage_content for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "specials public read" on public.seasonal_specials;
create policy "specials public read"
on public.seasonal_specials for select
using (true);

drop policy if exists "specials admin manage" on public.seasonal_specials;
create policy "specials admin manage"
on public.seasonal_specials for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "site settings public read" on public.site_settings;
create policy "site settings public read"
on public.site_settings for select
using (true);

drop policy if exists "site settings admin manage" on public.site_settings;
create policy "site settings admin manage"
on public.site_settings for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "media assets public read" on public.media_assets;
create policy "media assets public read"
on public.media_assets for select
using (true);

drop policy if exists "media assets admin manage" on public.media_assets;
create policy "media assets admin manage"
on public.media_assets for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

insert into storage.buckets (id, name, public)
values ('brand-media', 'brand-media', true)
on conflict (id) do nothing;

drop policy if exists "brand media public read" on storage.objects;
create policy "brand media public read"
on storage.objects for select
using (bucket_id = 'brand-media');

drop policy if exists "brand media admin write" on storage.objects;
create policy "brand media admin write"
on storage.objects for all
using (bucket_id = 'brand-media' and public.has_role(array['admin', 'staff']))
with check (bucket_id = 'brand-media' and public.has_role(array['admin', 'staff']));

do $$
begin
  begin
    alter publication supabase_realtime add table public.products;
  exception when duplicate_object then
    null;
  end;
  begin
    alter publication supabase_realtime add table public.product_images;
  exception when duplicate_object then
    null;
  end;
  begin
    alter publication supabase_realtime add table public.product_variants;
  exception when duplicate_object then
    null;
  end;
  begin
    alter publication supabase_realtime add table public.product_addons;
  exception when duplicate_object then
    null;
  end;
  begin
    alter publication supabase_realtime add table public.homepage_content;
  exception when duplicate_object then
    null;
  end;
  begin
    alter publication supabase_realtime add table public.seasonal_specials;
  exception when duplicate_object then
    null;
  end;
end $$;
