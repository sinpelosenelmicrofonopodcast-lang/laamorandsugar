alter table if exists public.orders
add column if not exists order_status text,
add column if not exists order_access_token text unique,
add column if not exists pickup_date timestamptz,
add column if not exists delivery_date timestamptz,
add column if not exists estimated_ready_at timestamptz,
add column if not exists internal_notes text,
add column if not exists payment_provider text,
add column if not exists payment_status text,
add column if not exists paypal_order_id text,
add column if not exists paypal_capture_id text,
add column if not exists paid_at timestamptz,
add column if not exists payment_response jsonb,
add column if not exists last_customer_message_at timestamptz,
add column if not exists last_admin_message_at timestamptz;

update public.orders
set order_status = case
  when status = 'confirmed' then 'confirmed'
  when status = 'in_progress' then 'in_progress'
  when status = 'ready' then 'ready_for_pickup'
  when status = 'delivered' then 'completed'
  when status = 'canceled' then 'cancelled'
  else 'pending_review'
end
where order_status is null;

update public.orders
set payment_provider = case
  when stripe_checkout_session_id is not null or stripe_payment_intent_id is not null then 'stripe'
  else coalesce(payment_provider, 'manual')
end
where payment_provider is null;

update public.orders
set payment_status = case
  when stripe_payment_intent_id is not null then 'paid'
  else coalesce(payment_status, 'pending')
end
where payment_status is null;

create table if not exists public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  sender_type text not null check (sender_type in ('customer', 'admin', 'system')),
  sender_name text not null,
  sender_email text,
  message_body text not null,
  attachment_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  old_status text,
  new_status text not null,
  note text,
  changed_by text not null,
  customer_visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  notification_type text not null,
  channel text not null,
  recipient text not null,
  subject text,
  body text not null,
  status text not null default 'pending',
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists orders_order_access_token_idx on public.orders (order_access_token);
create index if not exists orders_order_status_idx on public.orders (order_status);
create index if not exists orders_payment_status_idx on public.orders (payment_status);
create index if not exists order_messages_order_id_idx on public.order_messages (order_id, created_at desc);
create index if not exists order_messages_unread_idx on public.order_messages (order_id, is_read);
create index if not exists order_status_history_order_id_idx on public.order_status_history (order_id, created_at desc);
create index if not exists order_notifications_order_id_idx on public.order_notifications (order_id, created_at desc);

alter table public.order_messages enable row level security;
alter table public.order_status_history enable row level security;
alter table public.order_notifications enable row level security;

drop policy if exists "order messages admin manage" on public.order_messages;
create policy "order messages admin manage"
on public.order_messages for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "order status history admin manage" on public.order_status_history;
create policy "order status history admin manage"
on public.order_status_history for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));

drop policy if exists "order notifications admin manage" on public.order_notifications;
create policy "order notifications admin manage"
on public.order_notifications for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));
