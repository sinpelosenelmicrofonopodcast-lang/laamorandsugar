insert into public.categories (name, slug, description, image_url, sort_order)
values
  ('Chocolate Dipped', 'chocolate-dipped', 'Dipped berries and treats.', '/products/chocolate-covered-strawberries.svg', 1),
  ('Cupcakes', 'cupcakes', 'Premium cupcake boxes.', '/products/luxury-cupcake-box.svg', 2),
  ('Treat Boxes', 'treat-boxes', 'Curated dessert boxes.', '/products/mixed-treat-box.svg', 3),
  ('Seasonal Specials', 'seasonal-specials', 'Limited seasonal bundles.', '/products/mothers-day-special-box.svg', 4)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  sort_order = excluded.sort_order;

insert into public.homepage_content (
  banner_text,
  banner_cta_label,
  banner_cta_href,
  hero_eyebrow,
  hero_title,
  hero_description,
  hero_primary_cta_label,
  hero_primary_cta_href,
  hero_secondary_cta_label,
  hero_secondary_cta_href,
  featured_heading,
  featured_description,
  process_heading,
  process_description,
  testimonials_heading,
  testimonials_description,
  cta_heading,
  cta_description
)
values (
  'Spring bookings are open',
  'Reserve now',
  '/custom-orders',
  'Luxury treats crafted with heart',
  'Pastel confections for special moments',
  'Hand finished berries cupcakes and dessert boxes made with love by mom and her girls.',
  'Shop treats',
  '/shop',
  'Start custom order',
  '/custom-orders',
  'Best sellers',
  'A premium mix of berries cupcakes and dessert boxes.',
  'How it works',
  'Choose a ready order box or submit a custom request.',
  'Client love',
  'Families and hosts come back for polished treats.',
  'Need something custom',
  'Share your date colors budget and inspiration.'
);

insert into public.site_settings (
  business_name,
  tagline,
  support_email,
  support_phone,
  instagram_url,
  facebook_url,
  tiktok_url,
  address,
  business_hours,
  delivery_zones,
  pickup_instructions,
  free_delivery_threshold,
  currency
)
values (
  'L and A Amor and Sugar Co.',
  'Made with love by mom and her girls',
  'hello@amorandsugarco.com',
  '(555) 555-0147',
  'https://instagram.com',
  'https://facebook.com',
  'https://tiktok.com',
  'Houston Texas',
  '{"monday":"9am - 6pm","tuesday":"9am - 6pm","wednesday":"9am - 6pm","thursday":"9am - 6pm","friday":"9am - 6pm","saturday":"10am - 4pm"}'::jsonb,
  '["Houston","Sugar Land","Katy"]'::jsonb,
  'Pickup details are shared after confirmation.',
  150,
  'USD'
);

insert into public.testimonials (customer_name, rating, quote, occasion, featured, sort_order)
values
  ('Natalie G.', 5, 'Beautiful berries and elegant presentation.', 'Baby Shower', true, 0),
  ('Jasmin R.', 5, 'Great communication and delicious cupcakes.', 'Birthday', true, 1),
  ('Monique L.', 5, 'Everything looked premium and photographed beautifully.', 'Client Gift', true, 2);

insert into public.seasonal_specials (
  title,
  subtitle,
  description,
  cta_label,
  cta_href,
  image_url,
  starts_at,
  ends_at,
  is_active
)
values (
  'Mothers Day Special',
  'Soft florals and gifting ready sweets',
  'A limited seasonal box with premium presentation.',
  'Shop the special',
  '/shop?category=seasonal-specials',
  '/products/mothers-day-special-box.svg',
  timezone('utc', now()) - interval '5 days',
  timezone('utc', now()) + interval '30 days',
  true
);

insert into public.products (
  category_id,
  name,
  slug,
  short_description,
  description,
  sku,
  base_price,
  featured,
  seasonal,
  stock_quantity,
  lead_time_days,
  status,
  pickup_only,
  delivery_available,
  active
)
values
  ((select id from public.categories where slug = 'chocolate-dipped'), 'Chocolate Covered Strawberries', 'chocolate-covered-strawberries', 'Signature dipped strawberries.', 'A premium dozen of dipped strawberries with elegant finishing.', 'LAS-STRAW-001', 25, true, false, 24, 2, 'active', false, true, true),
  ((select id from public.categories where slug = 'cupcakes'), 'Luxury Cupcake Box', 'luxury-cupcake-box', 'An elevated cupcake assortment.', 'A curated cupcake box with smooth buttercream and polished presentation.', 'LAS-CUP-001', 25, true, false, 18, 2, 'active', false, true, true),
  ((select id from public.categories where slug = 'treat-boxes'), 'Mixed Treat Box', 'mixed-treat-box', 'A signature sampler box.', 'A curated mix of berries and dessert favorites.', 'LAS-MIX-001', 25, true, false, 16, 2, 'active', false, true, true),
  ((select id from public.categories where slug = 'chocolate-dipped'), 'Birthday Berry Bundle', 'birthday-berry-bundle', 'Festive dipped berries.', 'A polished berry bundle for birthday gifting and small events.', 'LAS-BDAY-001', 25, true, false, 12, 3, 'active', false, true, true),
  ((select id from public.categories where slug = 'treat-boxes'), 'Baby Shower Dessert Set', 'baby-shower-dessert-set', 'A dessert set for showers.', 'An event ready dessert set with soft pastel styling.', 'LAS-SHOWER-001', 25, false, false, 8, 5, 'active', false, true, true),
  ((select id from public.categories where slug = 'seasonal-specials'), 'Mothers Day Special Box', 'mothers-day-special-box', 'A limited seasonal gift box.', 'A seasonal dessert box with floral inspired presentation.', 'LAS-MDAY-001', 25, true, true, 10, 3, 'active', false, true, true)
on conflict (slug) do update
set
  category_id = excluded.category_id,
  name = excluded.name,
  short_description = excluded.short_description,
  description = excluded.description,
  sku = excluded.sku,
  base_price = excluded.base_price,
  featured = excluded.featured,
  seasonal = excluded.seasonal,
  stock_quantity = excluded.stock_quantity,
  lead_time_days = excluded.lead_time_days,
  status = excluded.status,
  pickup_only = excluded.pickup_only,
  delivery_available = excluded.delivery_available,
  active = excluded.active;

delete from public.product_images
where product_id in (
  select id
  from public.products
  where slug in (
    'chocolate-covered-strawberries',
    'luxury-cupcake-box',
    'mixed-treat-box',
    'birthday-berry-bundle',
    'baby-shower-dessert-set',
    'mothers-day-special-box'
  )
);

insert into public.product_images (product_id, image_url, alt_text, sort_order, is_primary)
values
  ((select id from public.products where slug = 'chocolate-covered-strawberries'), '/products/chocolate-covered-strawberries.svg', 'Chocolate covered strawberries', 0, true),
  ((select id from public.products where slug = 'chocolate-covered-strawberries'), '/products/placeholder-elegance.svg', 'Chocolate covered strawberries side detail', 1, false),
  ((select id from public.products where slug = 'luxury-cupcake-box'), '/products/luxury-cupcake-box.svg', 'Luxury cupcake box', 0, true),
  ((select id from public.products where slug = 'luxury-cupcake-box'), '/products/placeholder-elegance.svg', 'Luxury cupcake box detail', 1, false),
  ((select id from public.products where slug = 'mixed-treat-box'), '/products/mixed-treat-box.svg', 'Mixed treat box', 0, true),
  ((select id from public.products where slug = 'mixed-treat-box'), '/products/placeholder-elegance.svg', 'Mixed treat box detail', 1, false),
  ((select id from public.products where slug = 'birthday-berry-bundle'), '/products/birthday-berry-bundle.svg', 'Birthday berry bundle', 0, true),
  ((select id from public.products where slug = 'birthday-berry-bundle'), '/products/placeholder-elegance.svg', 'Birthday berry bundle detail', 1, false),
  ((select id from public.products where slug = 'baby-shower-dessert-set'), '/products/baby-shower-dessert-set.svg', 'Baby shower dessert set', 0, true),
  ((select id from public.products where slug = 'baby-shower-dessert-set'), '/products/placeholder-elegance.svg', 'Baby shower dessert set detail', 1, false),
  ((select id from public.products where slug = 'mothers-day-special-box'), '/products/mothers-day-special-box.svg', 'Mothers Day special box', 0, true),
  ((select id from public.products where slug = 'mothers-day-special-box'), '/products/placeholder-elegance.svg', 'Mothers Day special box detail', 1, false);

delete from public.product_variants
where product_id in (
  select id
  from public.products
  where slug in (
    'chocolate-covered-strawberries',
    'luxury-cupcake-box',
    'mixed-treat-box',
    'birthday-berry-bundle',
    'baby-shower-dessert-set',
    'mothers-day-special-box'
  )
);

insert into public.product_variants (product_id, name, quantity, price, option_value, price_delta, is_default, stock_quantity, sort_order)
values
  ((select id from public.products where slug = 'chocolate-covered-strawberries'), 'Petite Box', 6, 25, '6 pcs', 0, true, 12, 0),
  ((select id from public.products where slug = 'chocolate-covered-strawberries'), 'Classic Box', 12, 45, '12 pcs', 20, false, 12, 1),
  ((select id from public.products where slug = 'chocolate-covered-strawberries'), 'Deluxe Box', 18, 65, '18 pcs', 40, false, 8, 2),
  ((select id from public.products where slug = 'luxury-cupcake-box'), 'Petite Box', 6, 25, '6 cupcakes', 0, true, 12, 0),
  ((select id from public.products where slug = 'luxury-cupcake-box'), 'Classic Box', 12, 45, '12 cupcakes', 20, false, 8, 1),
  ((select id from public.products where slug = 'luxury-cupcake-box'), 'Deluxe Box', 18, 65, '18 cupcakes', 40, false, 6, 2),
  ((select id from public.products where slug = 'mixed-treat-box'), 'Petite Box', 6, 25, '6 pcs', 0, true, 8, 0),
  ((select id from public.products where slug = 'mixed-treat-box'), 'Classic Box', 12, 45, '12 pcs', 20, false, 6, 1),
  ((select id from public.products where slug = 'mixed-treat-box'), 'Party Box', 24, 80, '24 pcs', 55, false, 4, 2),
  ((select id from public.products where slug = 'birthday-berry-bundle'), 'Classic Box', 12, 45, '12 pcs', 20, true, 8, 0),
  ((select id from public.products where slug = 'birthday-berry-bundle'), 'Deluxe Box', 18, 65, '18 pcs', 40, false, 6, 1),
  ((select id from public.products where slug = 'baby-shower-dessert-set'), 'Classic Box', 12, 45, '12 pcs', 20, true, 4, 0),
  ((select id from public.products where slug = 'baby-shower-dessert-set'), 'Party Box', 24, 80, '24 pcs', 55, false, 4, 1),
  ((select id from public.products where slug = 'mothers-day-special-box'), 'Petite Box', 6, 25, '6 pcs', 0, true, 8, 0),
  ((select id from public.products where slug = 'mothers-day-special-box'), 'Classic Box', 12, 45, '12 pcs', 20, false, 6, 1);

delete from public.product_addons
where product_id in (
  select id
  from public.products
  where slug in ('chocolate-covered-strawberries', 'luxury-cupcake-box', 'baby-shower-dessert-set')
);

insert into public.product_addons (product_id, name, description, price, is_active, sort_order)
values
  ((select id from public.products where slug = 'chocolate-covered-strawberries'), 'Gold leaf detail', 'Adds a soft luxe gold touch.', 8, true, 0),
  ((select id from public.products where slug = 'luxury-cupcake-box'), 'Custom topper set', 'Coordinated toppers for your event theme.', 12, true, 0),
  ((select id from public.products where slug = 'baby-shower-dessert-set'), 'Matching cake plaque', 'Adds a coordinating plaque for the dessert spread.', 16, true, 0);
