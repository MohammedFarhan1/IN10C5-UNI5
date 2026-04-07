create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'user_role' and typnamespace = 'public'::regnamespace
  ) then
    create type public.user_role as enum ('customer', 'seller', 'admin');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'product_unit_status' and typnamespace = 'public'::regnamespace
  ) then
    create type public.product_unit_status as enum ('available', 'sold', 'delivered');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'order_status' and typnamespace = 'public'::regnamespace
  ) then
    create type public.order_status as enum ('ordered', 'shipped', 'delivered');
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role public.user_role not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  description text not null,
  price numeric(12, 2) not null check (price >= 0),
  image_url text,
  total_units integer not null check (total_units > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_units (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  unit_code text not null unique,
  status public.product_unit_status not null default 'available',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  unit_id uuid not null unique references public.product_units (id) on delete restrict,
  status public.order_status not null default 'ordered',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_products_seller_id on public.products (seller_id);
create index if not exists idx_product_units_product_id on public.product_units (product_id);
create index if not exists idx_product_units_status on public.product_units (status);
create index if not exists idx_orders_buyer_id on public.orders (buyer_id);
create index if not exists idx_orders_product_id on public.orders (product_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, role)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'customer')
  )
  on conflict (id) do update
    set email = excluded.email,
        role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = user_id and role = 'admin'
  );
$$;

create or replace function public.place_order(product_uuid uuid, buyer_uuid uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_unit_id uuid;
  created_order_id uuid;
begin
  if auth.uid() is distinct from buyer_uuid then
    raise exception 'You can only place orders as the authenticated buyer.';
  end if;

  if not exists (
    select 1
    from public.users
    where id = buyer_uuid and role = 'customer'
  ) then
    raise exception 'Only customer accounts can place orders.';
  end if;

  select pu.id
  into selected_unit_id
  from public.product_units pu
  where pu.product_id = product_uuid
    and pu.status = 'available'
  order by pu.created_at
  for update skip locked
  limit 1;

  if selected_unit_id is null then
    raise exception 'No available units remain for this product.';
  end if;

  update public.product_units
  set status = 'sold'
  where id = selected_unit_id;

  insert into public.orders (buyer_id, product_id, unit_id, status)
  values (buyer_uuid, product_uuid, selected_unit_id, 'ordered')
  returning id into created_order_id;

  return created_order_id;
end;
$$;

grant execute on function public.place_order(uuid, uuid) to authenticated;

alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.product_units enable row level security;
alter table public.orders enable row level security;

drop policy if exists "public can view products" on public.products;
create policy "public can view products"
  on public.products for select
  using (true);

drop policy if exists "public can view product units" on public.product_units;
create policy "public can view product units"
  on public.product_units for select
  using (true);

drop policy if exists "users can view themselves or admins can view all users" on public.users;
create policy "users can view themselves or admins can view all users"
  on public.users for select
  using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "sellers and admins can insert products" on public.products;
create policy "sellers and admins can insert products"
  on public.products for insert
  with check (
    seller_id = auth.uid()
    and exists (
      select 1 from public.users
      where id = auth.uid() and role in ('seller', 'admin')
    )
  );

drop policy if exists "sellers can update their own products" on public.products;
create policy "sellers can update their own products"
  on public.products for update
  using (seller_id = auth.uid() or public.is_admin(auth.uid()))
  with check (seller_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "sellers can delete their own products" on public.products;
create policy "sellers can delete their own products"
  on public.products for delete
  using (seller_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "sellers can insert their own product units" on public.product_units;
create policy "sellers can insert their own product units"
  on public.product_units for insert
  with check (
    exists (
      select 1
      from public.products p
      where p.id = product_id
        and (p.seller_id = auth.uid() or public.is_admin(auth.uid()))
    )
  );

drop policy if exists "sellers can update product units they own" on public.product_units;
create policy "sellers can update product units they own"
  on public.product_units for update
  using (
    exists (
      select 1
      from public.products p
      where p.id = product_id
        and (p.seller_id = auth.uid() or public.is_admin(auth.uid()))
    )
  )
  with check (
    exists (
      select 1
      from public.products p
      where p.id = product_id
        and (p.seller_id = auth.uid() or public.is_admin(auth.uid()))
    )
  );

drop policy if exists "buyers sellers and admins can view related orders" on public.orders;
create policy "buyers sellers and admins can view related orders"
  on public.orders for select
  using (
    buyer_id = auth.uid()
    or public.is_admin(auth.uid())
    or exists (
      select 1
      from public.products p
      where p.id = product_id and p.seller_id = auth.uid()
    )
  );