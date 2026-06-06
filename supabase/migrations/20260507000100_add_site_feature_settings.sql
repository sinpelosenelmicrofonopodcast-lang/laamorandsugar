alter table if exists public.site_settings
add column if not exists feature_settings jsonb;
