-- Run this on existing databases before `supabase/2026_04_10_marketplace_core.sql`.
-- PostgreSQL requires new enum values to be committed before later statements can use them.

alter type marketplace.order_status add value if not exists 'confirmed' after 'placed';
alter type marketplace.order_status add value if not exists 'packed' after 'confirmed';
alter type marketplace.order_status add value if not exists 'out_for_delivery' after 'shipped';
alter type marketplace.order_status add value if not exists 'returned' after 'cancelled';
