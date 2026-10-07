# ValueCart

Multi-category marketplace built with Next.js 14, TypeScript, Tailwind, Prisma and PostgreSQL. Prices are displayed in USDT through a configurable rate. Live payment is intentionally not connected.

## Requirements

- Node.js 18.18 or newer
- A PostgreSQL database (Neon, Supabase or any host)

## Setup

```
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

Set in `.env`: `DATABASE_URL`, `DIRECT_URL` (same value if you do not use a pooler), `AUTH_SECRET` (at least 32 random characters), `ADMIN_EMAIL`, `ADMIN_PASSWORD`. The seed creates a SUPER_ADMIN from the last two.

## Deploy on Vercel

1. Push the repo to GitHub and import it in Vercel.
2. Add the environment variables from `.env.example`.
3. Deploy. `npm run build` runs `prisma generate` automatically.
4. Run `npm run db:push` and `npm run db:seed` once against the production database.

## Deploy on Netlify

1. Import the repo in Netlify. `netlify.toml` already uses the Next.js plugin.
2. Add the same environment variables.
3. Deploy.

Both hosts have read-only file systems, so product images must go to object storage (Cloudinary, S3, Vercel Blob). The database stores only the URL.

## Payments

Everything goes through `src/lib/payment`. To add a gateway, implement `PaymentProvider` in a new file, add a `case` for your `PAYMENT_PROVIDER` value in `src/lib/payment/index.ts`, and fill in `/api/payment/create` and `/api/payment/webhook`. Never handle raw card data; use the gateway hosted page.
