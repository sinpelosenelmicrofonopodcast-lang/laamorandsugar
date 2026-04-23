alter table public.product_variants
  add column if not exists quantity integer,
  add column if not exists price numeric(10, 2);

update public.product_variants pv
set
  quantity = coalesce(
    pv.quantity,
    nullif(regexp_replace(coalesce(pv.option_value, ''), '\D', '', 'g'), '')::integer,
    0
  ),
  price = coalesce(pv.price, p.base_price + coalesce(pv.price_delta, 0))
from public.products p
where p.id = pv.product_id;

alter table public.product_variants
  alter column quantity set default 0,
  alter column quantity set not null,
  alter column price set default 0,
  alter column price set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'product_variants_quantity_check'
  ) then
    alter table public.product_variants
      add constraint product_variants_quantity_check check (quantity > 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'product_variants_price_check'
  ) then
    alter table public.product_variants
      add constraint product_variants_price_check check (price > 0);
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'product_images'
      and column_name = 'url'
  ) then
    alter table public.product_images rename column url to image_url;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'product_images_sort_order_check'
  ) then
    alter table public.product_images
      add constraint product_images_sort_order_check check (sort_order >= 0);
  end if;
end $$;

create unique index if not exists idx_product_images_single_primary
  on public.product_images (product_id)
  where is_primary = true;

create or replace function public.validate_product_images()
returns trigger
language plpgsql
as $$
declare
  target_product_id uuid;
  image_count integer;
  primary_count integer;
begin
  target_product_id := coalesce(new.product_id, old.product_id);

  select count(*)
  into image_count
  from public.product_images
  where product_id = target_product_id;

  if image_count > 3 then
    raise exception 'A product can only have between 1 and 3 images.';
  end if;

  if tg_op <> 'DELETE' and image_count = 0 then
    raise exception 'A product must have at least 1 image.';
  end if;

  select count(*)
  into primary_count
  from public.product_images
  where product_id = target_product_id
    and is_primary = true;

  if image_count > 0 and primary_count <> 1 then
    raise exception 'A product must have exactly 1 primary image.';
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists validate_product_images_trigger on public.product_images;
create constraint trigger validate_product_images_trigger
after insert or update or delete on public.product_images
deferrable initially deferred
for each row
execute function public.validate_product_images();
