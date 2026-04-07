alter table public.products add column if not exists custom_product_id text;

create unique index if not exists idx_products_seller_custom_product_id
  on public.products (seller_id, custom_product_id)
  where custom_product_id is not null;
