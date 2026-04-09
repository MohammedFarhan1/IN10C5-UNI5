# Future Work Split

## Purpose

This document describes how the VeriCart project can be split into future development workstreams for team collaboration. It is designed to help two or more members divide tasks, assign ownership, and progress in parallel without blocking each other.

## Workstreams

### 1. Product & Seller Experience

Focus: seller-facing flows, product creation, unit tracking, and inventory management.

Tasks:
- Product creation form improvements
- Seller product edit page and manual unit import flow
- Category-based SKU and custom product ID handling
- Bulk product upload and bulk unit assignment
- Seller dashboard performance and search filters
- Product card and product listing UI updates

Suggested owner: Seller/Product Owner

### 2. Customer & Checkout Flow

Focus: customer browsing, cart, checkout, orders, and tracking.

Tasks:
- Homepage and product detail page enhancements
- Add-to-cart, cart page, and checkout flow
- Order history and order status pages
- Public tracking page improvements
- Customer account page and notifications
- Validation for checkout and order placement

Suggested owner: Customer Flow Owner

### 3. Admin & Governance

Focus: admin tools, user management, security, and policy enforcement.

Tasks:
- Admin user management pages and flows
- Product approval, product list, and order oversight
- Role enforcement and admin-only route behavior
- Supabase role and RLS policy review
- Audit logging and admin reporting

Suggested owner: Admin/Platform Owner

### 4. Data & Infrastructure

Focus: backend schema, Supabase functions, seed data, and deployment readiness.

Tasks:
- Database schema updates and migrations
- Supabase SQL functions and trigger maintenance
- Sample seed data and import scripts
- Performance tuning for queries and indexes
- CI/CD or deployment pipeline configuration

Suggested owner: Data/Infrastructure Owner

## Future Feature Ideas

- Multi-unit checkout support for product bundles
- Seller inventory analytics and restock alerts
- Returns and refund workflow
- SMS/email notifications for order status updates
- Multi-seller marketplace support
- Customer reviews and ratings

## Suggested Split for Two Members

### Member A: Product/Seller Workstream

- Implement and refine seller product flows
- Improve manual unit import and `custom_product_id` handling
- Build seller-focused dashboard enhancements
- Ensure product-related components and pricing logic are consistent

### Member B: Customer/Checkout Workstream

- Refine customer browsing and checkout flows
- Build cart logic, order placement, and order status views
- Add unit tracking and order history details
- Test customer routes for auth and role access

### Shared Tasks

- Review and update Supabase schema and SQL functions together
- Coordinate UI design conventions and shared component changes
- Integrate new action APIs and validate both seller and customer flows
- Perform joint testing before merge, especially around orders and unit assignment

## Step-by-Step Collaboration Process

1. Review current project state and identify open issues in `PROJECT_DOCUMENTATION.md`.
2. Create separate branches for each workstream, e.g. `seller-work` and `customer-work`.
3. Define clear feature tickets or cards for each task.
4. Keep shared component and data changes small and communicate before modifying them.
5. Use pull requests with targeted reviews for changes that cross workstreams.
6. Merge seller/product work and customer/checkout work iteratively.
7. Run `npm run build` after each major integration to catch issues early.

## Communication Guidelines

- Use a shared task board or issue tracker to track progress.
- Reserve changes to core `lib/actions` and `lib/data.ts` for joint review.
- Coordinate any schema changes before implementing them.
- Sync daily on blockers and integration points.

## Recommended Future Milestones

1. Seller unit import and custom SKU experience complete.
2. Customer checkout, cart, and order tracking stable.
3. Admin controls and role policies validated.
4. Database schema finalized and seed scripts updated.
5. Final testing and deployment preparation.

## Notes

This document is intended as a collaboration guide and can be extended with sprint-specific tasks or ticket IDs as the team grows. If new features are added, update this file with the responsible workstream and estimated effort.
