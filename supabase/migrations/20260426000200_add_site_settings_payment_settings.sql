alter table if exists public.site_settings
add column if not exists payment_settings jsonb;
