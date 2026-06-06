create table if not exists public.social_post_settings (
  id uuid primary key default gen_random_uuid(),
  automation_enabled boolean not null default true,
  timezone text not null default 'America/Chicago',
  queue_days_ahead integer not null default 2 check (queue_days_ahead between 0 and 14),
  schedule_entries jsonb not null default '[
    {"id":"morning","label":"Morning","time":"09:00","enabled":true,"platforms":["instagram","facebook"]},
    {"id":"afternoon","label":"Afternoon","time":"14:00","enabled":true,"platforms":["instagram","facebook"]},
    {"id":"night","label":"Night","time":"20:00","enabled":true,"platforms":["instagram","facebook"]}
  ]'::jsonb,
  required_lines jsonb not null default '[
    "Available in Killeen, TX",
    "Delivery available (delivery fee applies for other areas)",
    "We also deliver on Fort Hood",
    "Order via inbox (DM us)"
  ]'::jsonb,
  cta_phrases_en jsonb not null default '[
    "Order now before we sell out",
    "DM us to place your order",
    "Limited availability in Killeen"
  ]'::jsonb,
  cta_phrases_es jsonb not null default '[
    "Ordena ahora antes de que se acaben",
    "Escribenos por inbox para hacer tu pedido",
    "Disponibilidad limitada en Killeen"
  ]'::jsonb,
  default_hashtags jsonb not null default '[
    "KilleenTX",
    "Desserts",
    "FortHood",
    "ChocolateCoveredStrawberries",
    "Cupcakes",
    "SupportLocal"
  ]'::jsonb,
  hashtags_enabled boolean not null default true,
  tone_notes text,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  source_kind text not null default 'automation' check (source_kind in ('automation', 'manual')),
  schedule_entry_id text,
  schedule_entry_label text,
  source_date date,
  scheduled_for timestamptz,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'publishing', 'published', 'canceled', 'failed')),
  platforms jsonb not null default '["instagram","facebook"]'::jsonb,
  product_name text not null,
  product_price numeric(10, 2),
  product_description text,
  image_url text not null,
  caption_en text not null,
  caption_es text not null,
  cta_en text,
  cta_es text,
  combined_caption text not null,
  hashtags jsonb,
  generation_notes jsonb,
  last_error text,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.social_post_publications (
  id uuid primary key default gen_random_uuid(),
  social_post_id uuid not null references public.social_posts (id) on delete cascade,
  platform text not null check (platform in ('instagram', 'facebook')),
  status text not null default 'pending' check (status in ('pending', 'published', 'failed')),
  remote_media_id text,
  remote_permalink text,
  published_at timestamptz,
  error_message text,
  metrics jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint social_post_publications_unique unique (social_post_id, platform)
);

create index if not exists social_posts_status_scheduled_idx
  on public.social_posts (status, scheduled_for);

create index if not exists social_posts_source_date_idx
  on public.social_posts (source_date, schedule_entry_id);

create index if not exists social_posts_product_idx
  on public.social_posts (product_id, created_at desc);

create index if not exists social_post_publications_platform_idx
  on public.social_post_publications (platform, status, published_at desc);

drop trigger if exists set_social_post_settings_updated_at on public.social_post_settings;
create trigger set_social_post_settings_updated_at
before update on public.social_post_settings
for each row execute procedure public.set_updated_at();

drop trigger if exists set_social_posts_updated_at on public.social_posts;
create trigger set_social_posts_updated_at
before update on public.social_posts
for each row execute procedure public.set_updated_at();

drop trigger if exists set_social_post_publications_updated_at on public.social_post_publications;
create trigger set_social_post_publications_updated_at
before update on public.social_post_publications
for each row execute procedure public.set_updated_at();

alter table public.social_post_settings enable row level security;
alter table public.social_posts enable row level security;
alter table public.social_post_publications enable row level security;

drop policy if exists "social post settings admin manage" on public.social_post_settings;
create policy "social post settings admin manage"
on public.social_post_settings for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "social posts admin manage" on public.social_posts;
create policy "social posts admin manage"
on public.social_posts for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "social post publications admin manage" on public.social_post_publications;
create policy "social post publications admin manage"
on public.social_post_publications for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

do $$
begin
  begin
    alter publication supabase_realtime add table public.social_posts;
  exception when duplicate_object then
    null;
  end;
  begin
    alter publication supabase_realtime add table public.social_post_publications;
  exception when duplicate_object then
    null;
  end;
end $$;
