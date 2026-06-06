create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  onesignal_id text,
  discount_code text unique not null,
  discount_percent int not null default 10,
  discount_used boolean not null default false,
  discount_used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint newsletter_subscribers_email_lowercase check (email = lower(btrim(email))),
  constraint newsletter_subscribers_discount_percent_check check (discount_percent > 0 and discount_percent <= 100)
);

create table if not exists public.discount_redemptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  discount_code text not null,
  order_id text,
  redeemed_at timestamptz not null default now()
);

create unique index if not exists newsletter_subscribers_email_idx
  on public.newsletter_subscribers (email);

create unique index if not exists newsletter_subscribers_discount_code_idx
  on public.newsletter_subscribers (discount_code);

create index if not exists newsletter_subscribers_discount_used_idx
  on public.newsletter_subscribers (discount_used);

create unique index if not exists discount_redemptions_discount_order_idx
  on public.discount_redemptions (discount_code, order_id)
  where order_id is not null;

create index if not exists discount_redemptions_email_idx
  on public.discount_redemptions (email);

alter table public.newsletter_subscribers enable row level security;
alter table public.discount_redemptions enable row level security;

drop policy if exists "Admins can manage newsletter subscribers" on public.newsletter_subscribers;
create policy "Admins can manage newsletter subscribers"
  on public.newsletter_subscribers
  for all
  using (public.has_role(array['admin', 'staff']))
  with check (public.has_role(array['admin', 'staff']));

drop policy if exists "Admins can manage discount redemptions" on public.discount_redemptions;
create policy "Admins can manage discount redemptions"
  on public.discount_redemptions
  for all
  using (public.has_role(array['admin', 'staff']))
  with check (public.has_role(array['admin', 'staff']));
