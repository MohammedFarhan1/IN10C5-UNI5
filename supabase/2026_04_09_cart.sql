-- Add cart functionality
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_cart_items_user_id on public.cart_items (user_id);
create index if not exists idx_cart_items_product_id on public.cart_items (product_id);
create unique index if not exists idx_cart_items_user_product on public.cart_items (user_id, product_id);

-- Function to update updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger handle_cart_items_updated_at
  before update on public.cart_items
  for each row execute procedure public.handle_updated_at();