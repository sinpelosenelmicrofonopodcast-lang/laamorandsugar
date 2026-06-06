create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  email text,
  email_opt_in boolean not null default true,
  push_opt_in boolean not null default false,
  sms_opt_in boolean not null default false,
  marketing_opt_in boolean not null default false,
  order_updates_opt_in boolean not null default true,
  source text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_preferences_email_lowercase check (email is null or email = lower(btrim(email)))
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text,
  subscription_id text unique not null,
  source text not null default 'website',
  opted_in boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_subscriptions_email_lowercase check (email is null or email = lower(btrim(email)))
);

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete set null,
  email text not null,
  template_key text not null,
  subject text not null,
  provider text not null default 'resend',
  provider_message_id text,
  status text not null default 'queued',
  opened_at timestamptz,
  clicked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_events_email_lowercase check (email = lower(btrim(email)))
);

create table if not exists public.abandoned_carts (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  email text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(10, 2) not null default 0,
  recovery_token text unique not null default encode(gen_random_bytes(12), 'hex'),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  email_sent_at timestamptz,
  push_sent_at timestamptz,
  converted_order_id uuid references public.orders (id) on delete set null,
  status text not null default 'open',
  metadata jsonb not null default '{}'::jsonb,
  constraint abandoned_carts_email_lowercase check (email is null or email = lower(btrim(email)))
);

create table if not exists public.notification_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text not null,
  status text not null default 'draft',
  audience jsonb not null default '{}'::jsonb,
  subject text,
  body text not null,
  cta_label text,
  cta_url text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  metrics jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.popup_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'draft',
  trigger_kind text not null default 'delay',
  delay_seconds integer not null default 9,
  frequency_days integer not null default 14,
  headline text not null,
  subheadline text,
  primary_cta_label text,
  primary_cta_url text,
  secondary_cta_label text,
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_preferences_email_idx on public.notification_preferences (email);
create index if not exists notification_preferences_user_id_idx on public.notification_preferences (user_id);
create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);
create index if not exists email_events_order_id_idx on public.email_events (order_id, created_at desc);
create index if not exists abandoned_carts_email_idx on public.abandoned_carts (email);
create index if not exists abandoned_carts_status_idx on public.abandoned_carts (status, last_seen_at desc);
create index if not exists notification_campaigns_status_idx on public.notification_campaigns (status, scheduled_for);
create index if not exists popup_campaigns_status_idx on public.popup_campaigns (status, starts_at, ends_at);

alter table public.notification_preferences enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.email_events enable row level security;
alter table public.abandoned_carts enable row level security;
alter table public.notification_campaigns enable row level security;
alter table public.popup_campaigns enable row level security;

drop policy if exists "notification preferences admin manage" on public.notification_preferences;
create policy "notification preferences admin manage"
on public.notification_preferences for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "push subscriptions admin manage" on public.push_subscriptions;
create policy "push subscriptions admin manage"
on public.push_subscriptions for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "email events admin manage" on public.email_events;
create policy "email events admin manage"
on public.email_events for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "abandoned carts admin manage" on public.abandoned_carts;
create policy "abandoned carts admin manage"
on public.abandoned_carts for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "notification campaigns admin manage" on public.notification_campaigns;
create policy "notification campaigns admin manage"
on public.notification_campaigns for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "popup campaigns admin manage" on public.popup_campaigns;
create policy "popup campaigns admin manage"
on public.popup_campaigns for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));
