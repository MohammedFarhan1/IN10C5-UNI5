# VeriCart - Full Project Description

## Project Overview

VeriCart is a modern e-commerce MVP built with Next.js and Supabase. It focuses on unit-level product tracking so that every product can generate multiple individual inventory units, each with a unique tracking code. Orders are carefully assigned to exactly one available unit, and both sellers and buyers can inspect order, product, and tracking status through dedicated dashboard routes.

This application demonstrates a complete workflow for customers, sellers, and admins, including signup, role-based access, unit generation, checkout, order tracking, and management.

## Core Purpose

The core purpose of VeriCart is to show how unit-level inventory tracking can be implemented in an e-commerce experience. The system ensures that every checkout is backed by a reserved physical unit, not just a generic product listing. This is especially useful for marketplaces, serialized goods, or products that must be tracked individually.

## Technology Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- `@supabase/ssr` for server-side Supabase integration

## User Roles

VeriCart supports three main roles with separate permissions and views:

- **Customer**
  - Browse products
  - Place checkout orders
  - View customer order history
  - Track purchased units

- **Seller**
  - Create and manage products
  - Generate product units for inventory tracking
  - Import or assign custom unit IDs
  - Review seller-specific order assignments

- **Admin**
  - Inspect users, products, and orders across the entire platform
  - Manage admin-level application data

## Main Features

### Customer features

- Public product catalog browsing from the homepage
- Product detail pages with pricing and availability
- Checkout flow for buying a product unit
- Customer order history page
- Order tracking page by `unit_code`
- Authenticated account and profile access

### Seller features

- Seller dashboard with product and order summaries
- Create new products with unit quantity and metadata
- Automatic generation of tracked `product_units`
- Manual import and assignment of custom unit IDs
- Upload bulk products or inventory units
- Manage and review seller orders

### Admin features

- Admin dashboard with global insights
- User management pages
- Product management pages
- Order management pages

### Inventory and tracking features

- Unique `unit_code` for every product unit
- `product_units` table with serialized unit tracking
- Atomic order placement for unit reservation
- Order lifecycle tracking: ordered, shipped, delivered, cancelled
- Public unit tracking via `/track/[unit_code]`

## Routes and Navigation

### Public routes

- `/` — Homepage and product listing
- `/product/[id]` — Product detail page
- `/track/[unit_code]` — Tracking page for a specific unit
- `/login` — Login page
- `/signup` — Signup page
- `/unauthorized` — Access denied page

### Customer routes

- `/checkout/[productId]` — Checkout page for a selected product
- `/orders` — Customer orders
- `/account` — Customer account management page

### Seller dashboards

- `/dashboard` — Seller home
- `/dashboard/products` — Seller product list
- `/dashboard/products/add` — Add a new product
- `/dashboard/products/bulk-upload` — Bulk product upload
- `/dashboard/products/[id]/edit` — Edit product and unit metadata
- `/dashboard/orders` — Seller order management

### Admin dashboards

- `/admin` — Admin home
- `/admin/users` — Admin user list
- `/admin/products` — Admin product list
- `/admin/orders` — Admin order list

## End-to-End Page Flow

### 1. Start at the homepage

- Visit `/` to view the public product catalog.
- The homepage shows available products with name, price, and image.
- Customers can click a product card to go to the product detail page.

### 2. Product detail page

- Visit `/product/[id]` to see a single product.
- The product page shows full name, description, price, and availability details.
- Customers can click the `Buy` or `Checkout` button to start purchase.

### 3. Checkout page

- Visiting `/checkout/[productId]` opens the checkout form.
- If the user is not signed in, the page prompts login or signup first.
- The checkout page collects payment details and shipping information if required.
- Customer submits the form to place an order and reserve one available unit.

### 4. Signup options: customer or seller

- Visit `/signup` to create a new account.
- The signup page provides role selection with two main options:
  - `Customer` — create an account to browse and buy products.
  - `Seller` — create an account to add and manage products.
- Signup form fields typically include:
  - full name
  - email
  - password
  - mobile number
  - address
  - role selection (customer or seller)
- After signup, the user is authenticated and redirected to the appropriate starting page.

### 5. Login

- Visit `/login` to sign in with existing credentials.
- The login form collects email and password.
- Successful login redirects:
  - customers to `/` or `/orders`
  - sellers to `/dashboard`
  - admins to `/admin`

### 6. Customer order flow

- After login, a customer can:
  - browse products on `/`
  - view product details on `/product/[id]`
  - checkout on `/checkout/[productId]`
  - view order history on `/orders`
  - track an individual unit on `/track/[unit_code]`
- The order history page shows past orders, status, and assigned unit codes.

### 7. Seller onboarding and product creation

- After signup or login, sellers land on `/dashboard`.
- Sellers can access `/dashboard/products` to view their product catalog.
- To add a new product, go to `/dashboard/products/add`.
- Product creation steps include:
  - enter product name and description
  - set price and image URL
  - define total units to generate
  - optionally set a seller SKU or custom product ID
- Submitting the form generates product records and the corresponding `product_units` inventory.

### 8. Seller product and unit management

- Sellers can edit existing products from `/dashboard/products`.
- The edit page at `/dashboard/products/[id]/edit` allows:
  - updating product details
  - importing or assigning custom unit IDs
  - adding metadata for specific units
- Sellers can review buyer orders in `/dashboard/orders`.
- Order status updates are reflected in the unit tracking view.

### 9. Unit tracking page

- Public unit tracking is available at `/track/[unit_code]`.
- Enter a `unit_code` to see product details, assigned order status, and related seller information.
- This page is useful for buyers or external viewers to verify shipment and delivery status.

### 10. Admin access

- Admins sign in via `/login` with an admin account.
- `/admin` is the admin landing page.
- Admins can review all users, products, and orders across the system.
- Admin user management is available at `/admin/users`.

## Data Model Summary

### `users`

- `id`: UUID primary key
- `email`: unique email address
- `role`: `customer`, `seller`, or `admin`
- `full_name`, `mobile_number`, `address`
- `created_at`

### `products`

- `id`: UUID primary key
- `seller_id`: UUID reference to seller user
- `custom_product_id`: optional seller-defined product identifier
- `name`, `description`, `price`, `image_url`
- `total_units`: number of trackable units
- `created_at`

### `product_units`

- `id`: UUID primary key
- `product_id`: UUID reference to product
- `unit_code`: unique generated tracking code
- `custom_unit_id`: optional seller-defined unit identifier
- `details`: JSON metadata for the unit
- `status`: `available`, `sold`, or `delivered`
- `created_at`

### `orders`

- `id`: UUID primary key
- `order_group_id`: UUID grouping related orders
- `buyer_id`: UUID reference to customer user
- `product_id`: UUID reference to purchased product
- `unit_id`: UUID reference to assigned unit
- `status`: `ordered`, `shipped`, `delivered`, `cancelled`
- `created_at`

## Key Architecture and Logic

### Unit-level order placement

- Seller creates a product and the system generates `total_units` unit records.
- During checkout, the platform locks one available unit and marks it sold.
- The order placement is atomic, preventing users from buying more units than exist.
- Each order maps to one specific `product_unit`.

### Role enforcement

- Protected route layouts verify authenticated user roles before rendering seller or admin pages.
- Supabase row-level security policies ensure sellers and buyers only access their own records.
- Admins have broader access for user and product oversight.

### Tracking and transparency

- Each unit has a public `unit_code` tracking page.
- The tracking page reveals product, seller, and order status information.
- Sellers can update order status to reflect shipment, delivery, or cancellation.

## Project Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with the Supabase keys:

```text
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

3. Run the database schema in Supabase SQL Editor:

- `supabase/schema.sql`
- `supabase/seed.sql`

4. Start development server:

```bash
npm run dev
```

## Demo Admin Credentials

- Email: `admin@uni5.com`
- Password: `admin123`

## Important Notes

- The app uses only public Supabase client environment variables in the frontend.
- Admin-level functionality requires `SUPABASE_SERVICE_ROLE_KEY` for secure actions.
- Email confirmation may be disabled in Supabase Auth for local/demo signup.

## Files and Components

### App entrypoints

- `app/page.tsx` — homepage
- `app/product/[id]/page.tsx` — product details
- `app/checkout/[productId]/page.tsx` — checkout flow
- `app/orders/page.tsx` — customer order history
- `app/track/[unit_code]/page.tsx` — public tracking

### Dashboard pages

- `app/dashboard/layout.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/products/page.tsx`
- `app/dashboard/orders/page.tsx`
- `app/admin/layout.tsx`
- `app/admin/page.tsx`
- `app/admin/users/page.tsx`

### Shared UI components

- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/input.tsx`
- `components/ui/table.tsx`
- `components/ui/status-badge.tsx`
- `components/cart/cart-item-list.tsx`
- `components/products/product-card.tsx`
- `components/products/product-detail-view.tsx`

### Forms and actions

- `components/forms/product-form.tsx`
- `components/forms/product-edit-form.tsx`
- `components/forms/product-unit-import-form.tsx`
- `components/forms/bulk-product-upload-form.tsx`
- `lib/actions/products.ts`
- `lib/actions/orders.ts`
- `lib/actions/cart.ts`
- `lib/actions/auth.ts`
- `lib/actions/admin-users.ts`

## Summary

VeriCart is a clean, role-driven e-commerce MVP designed around serialized inventory and order tracking. It is ideal for demonstrating how to build seller and admin dashboards, support unit-level fulfillment, and preserve strong data access controls using Supabase and Next.js.

This document summarizes the full project purpose, stack, roles, features, routes, data model, setup process, and core application flows in a single place.