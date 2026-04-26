alter table if exists public.homepage_content
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists hero_image_url text,
  add column if not exists hero_image_alt text,
  add column if not exists hero_mobile_image_url text,
  add column if not exists hero_mobile_image_alt text,
  add column if not exists hero_background_image_url text,
  add column if not exists hero_background_image_alt text,
  add column if not exists content_json jsonb not null default '{}'::jsonb;
