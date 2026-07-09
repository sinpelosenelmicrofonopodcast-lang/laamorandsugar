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
