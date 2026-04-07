# uni5

uni5 is a Next.js + Supabase MVP that demonstrates unit-level product tracking in an e-commerce flow. Each product generates multiple individual units, each unit receives its own `unit_code`, and every order is assigned exactly one available unit.

## Stack

- Next.js App Router
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL

## Roles

- Customer: browse products, buy one tracked unit, and view orders
- Seller: create products and generated units, then review order assignments
- Admin: inspect users, products, and orders

## Routes

- `/` homepage product listing
- `/product/[id]` product detail
- `/login` and `/signup`
- `/checkout/[productId]` customer-only checkout
- `/orders` customer order history
- `/track/[unit_code]` public tracking page
- `/dashboard`, `/dashboard/products`, `/dashboard/products/add`, `/dashboard/orders`
- `/admin`, `/admin/users`, `/admin/products`, `/admin/orders`

## Setup

1. Install dependencies.

```bash
npm install
```

2. Create `.env.local` from `.env.example`.

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can set either `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`. The app supports both.
`SUPABASE_SERVICE_ROLE_KEY` is required for secure admin user management from the app.

3. In Supabase SQL Editor, run [`supabase/schema.sql`](./supabase/schema.sql).
4. Then run [`supabase/seed.sql`](./supabase/seed.sql) to create the demo admin.
5. Make sure email confirmation is disabled in Supabase Auth for local/demo signup if you want immediate redirects after signup. With confirmation disabled, placeholder emails like `user@example.com` are fine for demos.
6. Start the app.

```bash
npm run dev
```

## Demo Admin

- Email: `admin@uni5.com`
- Password: `admin123`

## Core logic

- Seller product creation inserts one `products` row and generates `total_units` rows in `product_units`
- Customer checkout calls the `place_order` PostgreSQL function
- The SQL function locks one available unit, marks it `sold`, and creates the `orders` row atomically
- The tracking page resolves seller, product, and order linkage from `unit_code`

## Notes

- Secrets are not exposed; only public Supabase client env vars are used in the app layer
- Role checks are enforced on protected route layouts/pages before content is rendered
- RLS policies keep seller and buyer data scoped to the right records
