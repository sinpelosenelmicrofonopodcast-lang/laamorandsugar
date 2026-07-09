update public.categories
set
  name = 'Chocolate Covered Strawberries',
  slug = 'chocolate-covered-strawberries'
where slug = 'chocolate-covered-cookies-and-cream'
   or name ilike '%Chocolate Covered Strawberries%';

update public.categories
set
  name = 'Dessert Boxes',
  slug = 'dessert-boxes'
where slug = 'dessert-boxes';

update public.categories
set
  name = 'Chocolate Covered Cookies',
  slug = 'chocolate-covered-cookies'
where slug = 'chocolate-covered-cookies';

update public.categories
set
  name = 'Cake Pops',
  slug = 'cake-pops'
where lower(slug) = 'cake-pops';

update public.categories
set
  name = 'Cakesicles',
  slug = 'cakesicles'
where lower(slug) = 'cakesicles';

update public.categories
set
  name = 'Rice Krispies Treats',
  slug = 'rice-krispies-treats'
where slug = 'rice-krispies-treats';

update public.categories
set
  name = 'Chocolate Covered Pretzels',
  slug = 'chocolate-covered-pretzels'
where slug = 'chocolate-covered-pretzels';

update public.categories
set
  name = 'Chocolate Covered Marshmallows',
  slug = 'chocolate-covered-marshmallows'
where slug = 'chocolate-covered-marshmallows';
