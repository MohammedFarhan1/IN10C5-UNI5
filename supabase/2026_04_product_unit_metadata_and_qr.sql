alter table public.product_units add column if not exists custom_unit_id text;
alter table public.product_units add column if not exists details jsonb;

create unique index if not exists idx_product_units_product_custom_unit_id
  on public.product_units (product_id, custom_unit_id)
  where custom_unit_id is not null;
