create table if not exists public.about_page_content (
  id uuid primary key default gen_random_uuid(),
  hero_eyebrow text,
  hero_title text,
  hero_text text,
  hero_image_url text,
  hero_image_alt text,
  section_one_title text,
  section_one_text text,
  section_two_title text,
  section_two_text text,
  style_title text,
  style_text text,
  cta_title text,
  cta_text text,
  cta_button_text text,
  cta_button_link text,
  gallery_images jsonb,
  highlight_cards jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_about_page_content_updated_at on public.about_page_content;
create trigger set_about_page_content_updated_at
before update on public.about_page_content
for each row execute procedure public.set_updated_at();

alter table public.about_page_content enable row level security;

drop policy if exists "about page public read" on public.about_page_content;
create policy "about page public read"
on public.about_page_content for select
using (true);

drop policy if exists "about page admin manage" on public.about_page_content;
create policy "about page admin manage"
on public.about_page_content for all
using (public.has_role(array['admin', 'staff']))
with check (public.has_role(array['admin', 'staff']));
