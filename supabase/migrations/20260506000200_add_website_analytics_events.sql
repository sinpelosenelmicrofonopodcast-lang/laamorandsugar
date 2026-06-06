create table if not exists public.website_events (
  id uuid primary key default gen_random_uuid(),
  anonymous_id text,
  user_id uuid references auth.users (id) on delete set null,
  event_name text not null,
  path text,
  referrer text,
  user_agent text,
  product_id uuid references public.products (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  cart_subtotal numeric(10, 2),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists website_events_event_name_idx
on public.website_events (event_name, created_at desc);

create index if not exists website_events_anonymous_id_idx
on public.website_events (anonymous_id, created_at desc);

create index if not exists website_events_path_idx
on public.website_events (path, created_at desc);

alter table public.website_events enable row level security;

drop policy if exists "website events admin read" on public.website_events;
create policy "website events admin read"
on public.website_events for select
using (public.has_role(array['admin', 'staff']));

drop policy if exists "website events admin manage" on public.website_events;
create policy "website events admin manage"
on public.website_events for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));
