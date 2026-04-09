# VeriCart Project Documentation

## Project Overview

VeriCart is a Next.js + Supabase e-commerce MVP focused on unit-level inventory tracking. Each product can generate multiple tracked units, and buyers place orders that reserve exactly one available physical unit. Sellers can create products, import or assign custom unit IDs, and track orders. Admins can inspect users, products, and orders.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth + PostgreSQL
- Supabase server-side actions via `@supabase/ssr`

## Main Features

- Customer product browsing and checkout
- Unit-level tracking through unique `unit_code`
- Seller product creation with generated inventory units
- Manual seller unit import and custom unit IDs
- Admin management of users, products, and orders
- Order status lifecycle and cancellation support before shipping

## Roles

- `customer`
- `seller`
- `admin`

Role checks are enforced in protected route layouts and server actions. Users are created in Supabase Auth and mirrored into `public.users` via trigger logic.

## Routes / Pages

### Public routes

- `/` - homepage and product listing
- `/product/[id]` - product detail page
- `/track/[unit_code]` - public unit tracking page
- `/login` - login page
- `/signup` - signup page
- `/unauthorized` - access denied page

### Customer routes

- `/checkout/[productId]` - checkout for a specific product
- `/orders` - customer order history
- `/account` - customer account page

### Seller dashboard

- `/dashboard` - seller dashboard
- `/dashboard/products` - seller product list
- `/dashboard/products/add` - add product page
- `/dashboard/products/bulk-upload` - bulk product upload page
- `/dashboard/products/[id]/edit` - edit product and import manual units
- `/dashboard/orders` - seller order list

### Admin dashboard

- `/admin` - admin home
- `/admin/users` - admin user management
- `/admin/users/[id]/edit` - edit user details
- `/admin/products` - admin product management
- `/admin/orders` - admin order management

## Key Files and Locations

### UI and page components

- `app/page.tsx` - homepage
- `app/product/[id]/page.tsx` - product details
- `app/checkout/[productId]/page.tsx` - checkout page
- `app/orders/page.tsx` - customer orders
- `app/track/[unit_code]/page.tsx` - tracking page
- `app/dashboard/**` - seller dashboard pages
- `app/admin/**` - admin-related pages

### Shared components

- `components/forms/product-form.tsx`
- `components/forms/product-edit-form.tsx`
- `components/forms/product-unit-import-form.tsx`
- `components/forms/order-status-form.tsx`
- `components/products/product-card.tsx`
- `components/products/seller-products-table.tsx`
- `components/cart/cart-item-list.tsx`

### Actions and business logic

- `lib/actions/auth.ts` - login, signup, logout
- `lib/actions/cart.ts` - add/update/remove cart items, checkout cart
- `lib/actions/products.ts` - create/update products, bulk upload, manual unit import, delete products
- `lib/actions/orders.ts` - create orders, cancel order groups, update order status
- `lib/actions/account.ts` - customer account updates
- `lib/actions/admin-users.ts` - admin user create/update/delete

### Data access

- `lib/data.ts` - data fetching utilities for products, units, categories, sellers, orders
- `lib/utils.ts` - formatting helpers, URL helpers, and display utilities
- `lib/auth.ts` - role enforcement helpers for protected pages

### Supabase schema and SQL

- `supabase/schema.sql` - database schema and trigger/functions
- `supabase/seed.sql` - demo admin user seeding
- `supabase/sample_products_seed.sql` - product and unit seeding script
- `supabase/2026_04_bulk_product_upload.sql` - migration for custom product IDs and unit metadata

## Database Schema Summary

### `public.users`

- `id` uuid PK
- `email` text unique
- `role` enum `customer | seller | admin`
- `full_name`, `mobile_number`, `address`
- `created_at`

### `public.products`

- `id` uuid PK
- `seller_id` UUID FK to `public.users`
- `custom_product_id` text unique globally and per seller
- `name`, `description`, `price`, `image_url`
- `total_units`
- `created_at`

### `public.product_units`

- `id` uuid PK
- `product_id` UUID FK to `public.products`
- `unit_code` text unique platform-generated unit tracking code
- `custom_unit_id` text for seller-defined unit IDs
- `details` jsonb for unit metadata
- `status` enum `available | sold | delivered`
- `created_at`

### `public.orders`

- `id` uuid PK
- `order_group_id` uuid to group related orders
- `buyer_id` UUID FK to `public.users`
- `product_id` UUID FK to `public.products`
- `unit_id` UUID FK to `public.product_units`
- `status` enum `ordered | shipped | delivered | cancelled`
- `created_at`

## Supabase SQL Functions

### `public.handle_new_user()`

- Trigger function called after a new `auth.users` row is created
- Mirrors auth users to `public.users`
- Uses `raw_user_meta_data.role` to set account role

### `public.place_order(product_uuid, buyer_uuid)`

- Public wrapper around `place_order_batch`
- Ensures atomic order placement for one unit

### `public.place_order_batch(product_uuid, buyer_uuid, quantity_int)`

- Locks available units for the selected product
- Verifies buyer is authenticated and is a `customer`
- Marks selected `product_units` as `sold`
- Generates order records and returns order group ID

## Core Workflows

### Seller product creation

1. Seller fills product form with name, description, price, total units, optional SKU ID, and optional categories.
2. `createProductAction` inserts a `products` row and generates `total_units` `product_units` rows.
3. Each unit gets a platform `unit_code` and optionally a seller `custom_unit_id` via manual import.

### Manual unit import

- Sellers import unit IDs using a simple text-based import form.
- Each line uses `UNIT-ID | details`
- Details support plain key:value pairs or free text.
- Existing generated unit rows remain intact and receive custom IDs and metadata.

### Customer checkout

- Customer selects a product and submits checkout.
- The app authorizes the customer and calls Supabase functions to reserve one available unit.
- A new `orders` row is created with the assigned `unit_id`.

### Order tracking

- The public tracking page resolves `unit_code`
- It displays assigned product and order status
- Sellers can manage shipped/delivered/cancelled order statuses

## Scripts

- `npm install` - install dependencies
- `npm run dev` - start local development server
- `npm run build` - build the app for production
- `npm run start` - start the production server
- `npm run lint` - run ESLint checks

## Environment Variables

Required env values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Developer Notes

- Use `app` routes for the Next.js pages and `components` for reusable UI.
- All user-facing mutations are implemented as server actions in `lib/actions/*.ts`.
- Data fetching and query logic lives in `lib/data.ts`.
- Role enforcement occurs in `lib/auth.ts` and protected layouts.
- The seed scripts are located under `supabase/`.

## Sharing and Onboarding

For new teammates, the recommended onboarding steps are:

1. Clone the repo.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and populate Supabase keys.
4. Run the SQL files in Supabase: `supabase/schema.sql`, `supabase/seed.sql`.
5. Start the app with `npm run dev`.
6. Use the demo admin credentials if available.

## Important Paths

- `app/` - application pages and layouts
- `components/` - reusable UI blocks and forms
- `lib/` - business logic, data access, utilities, auth
- `supabase/` - database schema, seed scripts, migrations
- `types/` - shared TypeScript types

## Notes on Current Implementation

- Product IDs now support explicit custom IDs such as category-based SKUs.
- Seller unit import is simplified to manual line input rather than JSON-only imports.
- All customer and seller actions are validated on the server before applying changes.
- The current build is stable and compiles successfully with the existing schema and app logic.
