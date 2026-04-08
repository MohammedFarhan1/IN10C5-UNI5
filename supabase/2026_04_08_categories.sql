-- Add categories and product categories tables
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_categories (
  product_id uuid not null references public.products (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (product_id, category_id)
);

create index if not exists idx_product_categories_product_id on public.product_categories (product_id);
create index if not exists idx_product_categories_category_id on public.product_categories (category_id);

-- Insert some default categories
insert into public.categories (name, description) values
  ('Electronics', 'Electronic devices and gadgets'),
  ('Clothing', 'Apparel and fashion items'),
  ('Home & Garden', 'Home improvement and gardening supplies'),
  ('Books', 'Books and publications'),
  ('Sports', 'Sports equipment and accessories'),
  ('Beauty', 'Beauty and personal care products'),
  ('Toys', 'Toys and games'),
  ('Automotive', 'Car parts and accessories')
on conflict (name) do nothing;