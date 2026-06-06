alter table public.products
add column if not exists custom_options jsonb;
