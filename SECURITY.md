# Production Security Notes

## Required Vercel environment variables

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CRON_SECRET`
- Optional monitoring: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_LOGROCKET_APP_ID`

Only `NEXT_PUBLIC_*` variables should be readable by browser code. Never expose service-role, webhook, payment, cron, or Turnstile secret keys.

## Cloudflare setup

- Proxy `amorandsugarla.com` through Cloudflare with SSL/TLS mode set to Full (strict).
- Enable WAF managed rules, bot fight mode or Super Bot Fight Mode, and challenge suspicious POST traffic to `/api/*`, `/checkout`, `/login`, `/account/*`, and `/order-status/*`.
- Create a Turnstile widget for `amorandsugarla.com`, then set the site key and secret in Vercel.
- Keep Cloudflare cache rules conservative for authenticated routes: bypass `/admin*`, `/account*`, `/checkout*`, `/cart*`, `/order-status*`, `/api*`, and `/auth*`.

## Vercel setup

- Set production environment variables only in Vercel project settings.
- Protect preview deployments if customer/admin data is reachable.
- Keep deployment protection enabled for non-production branches.
- Use Stripe webhook signing, not unauthenticated payment callbacks.
- Review Vercel function logs for `suspicious_activity_logs` events and rate-limit spikes.

## Backups

- Enable Supabase Point-in-Time Recovery for production.
- Schedule daily logical backups for orders, order items, products, media metadata, customer messages, coupons, and site settings.
- Store backups outside the primary Supabase project with restricted access.
- Test restore procedures quarterly.

## Monitoring

The codebase includes optional hooks for Sentry and LogRocket environment variables. Install and initialize the SDKs when those accounts are ready, then alert on:

- Payment webhook failures
- Upload MIME mismatches
- Rate-limit spikes
- Failed Turnstile validations
- Admin setting/product/order changes
- Unknown order IDs in payment webhooks
