create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid null,
  actor_role text null,
  action text not null,
  target_type text null,
  target_id text null,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text null,
  user_agent text null,
  severity text not null default 'info',
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx on public.admin_audit_logs (created_at desc);
create index if not exists admin_audit_logs_actor_id_idx on public.admin_audit_logs (actor_id);
create index if not exists admin_audit_logs_action_idx on public.admin_audit_logs (action);

alter table public.admin_audit_logs enable row level security;

create table if not exists public.suspicious_activity_logs (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text null,
  user_agent text null,
  severity text not null default 'medium',
  created_at timestamptz not null default now()
);

create index if not exists suspicious_activity_logs_created_at_idx on public.suspicious_activity_logs (created_at desc);
create index if not exists suspicious_activity_logs_event_idx on public.suspicious_activity_logs (event);
create index if not exists suspicious_activity_logs_ip_idx on public.suspicious_activity_logs (ip_address);

alter table public.suspicious_activity_logs enable row level security;
