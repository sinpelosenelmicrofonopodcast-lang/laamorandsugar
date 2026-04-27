# L&A Amor & Sugar Co.

Production-ready dessert storefront + admin CMS built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Supabase, Stripe, React Hook Form, and Zod.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style component system
- Supabase Auth, Postgres, Storage, RLS, Realtime publication
- Stripe Checkout + webhook handling
- React Hook Form + Zod
- Vercel-ready deployment setup

## Included Features

- Premium storefront UI for a luxury dessert brand
- Home, shop, product detail, custom orders, about, reviews, FAQ, contact, cart, checkout, and order success pages
- Functional persistent cart with variants and add-ons
- Stripe checkout flow
- Delivery or pickup selection, fulfillment date, and notes
- Custom orders with inspiration image upload
- Protected admin dashboard with roles: `admin`, `staff`
- Admin sections for dashboard, products, categories, orders, custom orders, coupons, homepage editor, seasonal specials, testimonials, media library, and settings
- OpenAI-ready product copy generation hook
- Supabase schema, seed, RLS, storage bucket, and realtime publication setup

## Project Structure

```text
app/                   Next.js App Router pages and API routes
components/            UI, storefront, and admin components
actions/               Server Actions for auth, checkout, and CMS updates
lib/                   Data layer, validation, config, auth, Stripe, Supabase
public/                Brand and product placeholder assets
supabase/migrations/   SQL migration files
supabase/seed.sql      Initial dessert brand seed data
```

## 1. Install

```bash
pnpm install
cp .env.example .env.local
```

## 2. Create a Supabase Project

1. Create a new Supabase project.
2. In Supabase Auth, enable the sign-in method you want to use for admin access. Email/password is the simplest option for this project.
3. Copy these values into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 3. Run Supabase Schema + Seed

Option A: Supabase CLI

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

Option B: Supabase SQL Editor

1. Open the SQL editor.
2. Run the migration in [`supabase/migrations/20260322180000_init.sql`](/Users/gabriel/Leslie/supabase/migrations/20260322180000_init.sql).
3. Run the seed in [`supabase/seed.sql`](/Users/gabriel/Leslie/supabase/seed.sql).

The migration creates:

- Auth profile trigger
- Roles table and role helpers
- Full storefront/admin schema
- RLS policies
- Public storage bucket `brand-media`
- Realtime publication for products, homepage content, and specials

## 4. Create the First Admin User

1. In Supabase Auth, create a user manually or sign up through the app.
2. Promote that user with SQL:

```sql
update public.roles
set role = 'admin'
where user_id = (
  select id from auth.users where email = 'your-admin-email@example.com'
);
```

Use `'staff'` instead of `'admin'` for limited back-office access.

## 5. Configure Stripe

Add these values to `.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

The storefront uses dynamic Stripe Checkout line items, so you do not need to pre-create Stripe Products.

Local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook secret from Stripe CLI into `STRIPE_WEBHOOK_SECRET`.

## 6. Optional OpenAI Hook

To enable the admin button `Generate description`, set:

```env
OPENAI_API_KEY=
```

If this variable is missing, the button stays wired but returns a clear setup message.

## 7. Run Locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Recommended verification:

```bash
pnpm typecheck
pnpm build
```

## 8. Deploy to Vercel

1. Push the repo to GitHub.
2. Import the project into Vercel.
3. Add all environment variables from `.env.example`.
4. Set `NEXT_PUBLIC_SITE_URL` to your production domain, for example:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

5. Deploy.
6. In Stripe, add a production webhook to:

```text
https://your-domain.vercel.app/api/stripe/webhook
```

## Seeded Demo Products

- Chocolate Covered Strawberries
- Luxury Cupcake Box
- Mixed Treat Box
- Birthday Berry Bundle
- Baby Shower Dessert Set
- Mother’s Day Special Box

Each seeded product includes:

- Name
- Slug
- Description
- Price
- Category
- Elegant local placeholder image

## Notes

- Admin and checkout actions use the server-side Supabase service role after validating access.
- Public pages degrade gracefully when env vars are not configured yet, but real CRUD, uploads, auth, and checkout require Supabase and Stripe credentials.
- Product publishing, homepage content, and seasonal specials are prepared for Supabase realtime publication and cache revalidation.
