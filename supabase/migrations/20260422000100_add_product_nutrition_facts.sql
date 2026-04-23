alter table public.products
  add column if not exists nutrition_serving_size text,
  add column if not exists nutrition_servings_per_container text,
  add column if not exists nutrition_facts jsonb,
  add column if not exists allergen_statement text;
