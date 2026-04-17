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
        create type public.order_status as enum ('ordered', 'shipped', 'delivered', 'cancelled');
      end if;
    end $$;

    do $$
    begin
      if not exists (
        select 1 from pg_type where typname = 'account_status' and typnamespace = 'public'::regnamespace
      ) then
        create type public.account_status as enum ('pending', 'approved', 'rejected');
      end if;
    end $$;

    create table if not exists public.users (
      id uuid primary key references auth.users (id) on delete cascade,
      email text not null unique,
      role public.user_role not null,
      full_name text,
      business_name text,
      spoc_name text,
      cin text,
      gst text,
      trademark_url text,
      document_url text,
      mobile_number text,
      address text,
      account_status public.account_status not null default 'approved',
      created_at timestamptz not null default timezone('utc', now())
    );

    alter table public.users add column if not exists full_name text;
    alter table public.users add column if not exists business_name text;
    alter table public.users add column if not exists spoc_name text;
    alter table public.users add column if not exists cin text;
    alter table public.users add column if not exists gst text;
    alter table public.users add column if not exists trademark_url text;
    alter table public.users add column if not exists document_url text;
    alter table public.users add column if not exists mobile_number text;
    alter table public.users add column if not exists address text;
    alter table public.users add column if not exists account_status public.account_status not null default 'approved';

    create table if not exists public.products (
      id uuid primary key default gen_random_uuid(),
      seller_id uuid not null references public.users (id) on delete cascade,
      custom_product_id text,
      name text not null,
      description text not null,
      price numeric(12, 2) not null check (price >= 0),
      image_url text,
      total_units integer not null check (total_units > 0),
      created_at timestamptz not null default timezone('utc', now())
    );

    alter table public.products add column if not exists custom_product_id text;

    create table if not exists public.product_units (
      id uuid primary key default gen_random_uuid(),
      product_id uuid not null references public.products (id) on delete cascade,
      unit_code text not null unique,
      custom_unit_id text,
      details jsonb,
      status public.product_unit_status not null default 'available',
      created_at timestamptz not null default timezone('utc', now())
    );

    alter table public.product_units add column if not exists custom_unit_id text;
    alter table public.product_units add column if not exists details jsonb;

    create table if not exists public.orders (
      id uuid primary key default gen_random_uuid(),
      order_group_id uuid not null default gen_random_uuid(),
      buyer_id uuid not null references public.users (id) on delete cascade,
      product_id uuid not null references public.products (id) on delete cascade,
      unit_id uuid not null unique references public.product_units (id) on delete restrict,
      status public.order_status not null default 'ordered',
      created_at timestamptz not null default timezone('utc', now())
    );

    alter table public.orders add column if not exists order_group_id uuid not null default gen_random_uuid();

    create index if not exists idx_products_seller_id on public.products (seller_id);
    create unique index if not exists idx_products_seller_custom_product_id on public.products (seller_id, custom_product_id) where custom_product_id is not null;
    create unique index if not exists idx_products_custom_product_id on public.products (custom_product_id) where custom_product_id is not null;
    create index if not exists idx_product_units_product_id on public.product_units (product_id);
    create index if not exists idx_product_units_status on public.product_units (status);
    create unique index if not exists idx_product_units_product_custom_unit_id on public.product_units (product_id, custom_unit_id) where custom_unit_id is not null;
    create index if not exists idx_orders_buyer_id on public.orders (buyer_id);
    create index if not exists idx_orders_product_id on public.orders (product_id);
    create index if not exists idx_orders_order_group_id on public.orders (order_group_id);

    create or replace function public.handle_new_user()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $$
    declare
      next_role public.user_role := coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'customer');
      next_status public.account_status := coalesce(
        (new.raw_user_meta_data ->> 'account_status')::public.account_status,
        case when coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'customer') = 'seller'
          then 'pending'::public.account_status
          else 'approved'::public.account_status
        end
      );
    begin
      insert into public.users (
        id,
        email,
        role,
        full_name,
        business_name,
        spoc_name,
        cin,
        gst,
        mobile_number,
        account_status
      )
      values (
        new.id,
        new.email,
        next_role,
        nullif(new.raw_user_meta_data ->> 'full_name', ''),
        nullif(new.raw_user_meta_data ->> 'business_name', ''),
        nullif(new.raw_user_meta_data ->> 'spoc_name', ''),
        nullif(new.raw_user_meta_data ->> 'cin', ''),
        nullif(new.raw_user_meta_data ->> 'gst', ''),
        nullif(new.raw_user_meta_data ->> 'mobile_number', ''),
        next_status
      )
      on conflict (id) do update
        set email = excluded.email,
            role = excluded.role,
            full_name = coalesce(public.users.full_name, excluded.full_name),
            business_name = coalesce(public.users.business_name, excluded.business_name),
            spoc_name = coalesce(public.users.spoc_name, excluded.spoc_name),
            cin = coalesce(public.users.cin, excluded.cin),
            gst = coalesce(public.users.gst, excluded.gst),
            mobile_number = coalesce(public.users.mobile_number, excluded.mobile_number),
            account_status = coalesce(public.users.account_status, excluded.account_status);

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

    create or replace function public.is_approved_seller(user_id uuid)
    returns boolean
    language sql
    stable
    set search_path = public
    as $$
      select exists (
        select 1
        from public.users
        where id = user_id
          and (
            role = 'admin'
            or (role = 'seller' and account_status = 'approved')
          )
      );
    $$;

    create or replace function public.place_order(product_uuid uuid, buyer_uuid uuid)
    returns uuid
    language plpgsql
    security definer
    set search_path = public
    as $$
    declare
    begin
      return public.place_order_batch(product_uuid, buyer_uuid, 1);
    end;
    $$;

    create or replace function public.place_order_batch(
      product_uuid uuid,
      buyer_uuid uuid,
      quantity_int integer
    )
    returns uuid
    language plpgsql
    security definer
    set search_path = public
    as $$
    declare
      selected_unit_ids uuid[];
      selected_count integer;
      created_order_group_id uuid := gen_random_uuid();
    begin
      if auth.uid() is distinct from buyer_uuid then
        raise exception 'You can only place orders as the authenticated buyer.';
      end if;

      if quantity_int is null or quantity_int < 1 then
        raise exception 'Quantity must be at least 1.';
      end if;

      if quantity_int > 10 then
        raise exception 'Quantity cannot exceed 10 units per order.';
      end if;

      if not exists (
        select 1
        from public.users
        where id = buyer_uuid and role = 'customer'
      ) then
        raise exception 'Only customer accounts can place orders.';
      end if;

      select coalesce(array_agg(locked_units.id), '{}')
      into selected_unit_ids
      from (
        select pu.id
        from public.product_units pu
        where pu.product_id = product_uuid
          and pu.status = 'available'
        order by pu.created_at
        for update skip locked
        limit quantity_int
      ) as locked_units;

      selected_count := coalesce(array_length(selected_unit_ids, 1), 0);

      if selected_count < quantity_int then
        raise exception 'Only % unit(s) are currently available for this product.', selected_count;
      end if;

      update public.product_units
      set status = 'sold'
      where id = any(selected_unit_ids);

      insert into public.orders (order_group_id, buyer_id, product_id, unit_id, status)
      select created_order_group_id, buyer_uuid, product_uuid, selected_unit_id, 'ordered'
      from unnest(selected_unit_ids) as selected_unit_id;

      return created_order_group_id;
    end;
    $$;

    grant execute on function public.place_order(uuid, uuid) to authenticated;
    grant execute on function public.place_order_batch(uuid, uuid, integer) to authenticated;

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

    drop policy if exists "users can update themselves or admins can update all users" on public.users;
    create policy "users can update themselves or admins can update all users"
      on public.users for update
      using (auth.uid() = id or public.is_admin(auth.uid()))
      with check (auth.uid() = id or public.is_admin(auth.uid()));

    drop policy if exists "sellers and admins can insert products" on public.products;
    create policy "sellers and admins can insert products"
      on public.products for insert
      with check (
        seller_id = auth.uid()
        and public.is_approved_seller(auth.uid())
      );

    drop policy if exists "sellers can update their own products" on public.products;
    create policy "sellers can update their own products"
      on public.products for update
      using (
        (seller_id = auth.uid() and public.is_approved_seller(auth.uid()))
        or public.is_admin(auth.uid())
      )
      with check (
        (seller_id = auth.uid() and public.is_approved_seller(auth.uid()))
        or public.is_admin(auth.uid())
      );

    drop policy if exists "sellers can delete their own products" on public.products;
    create policy "sellers can delete their own products"
      on public.products for delete
      using (
        (seller_id = auth.uid() and public.is_approved_seller(auth.uid()))
        or public.is_admin(auth.uid())
      );

    drop policy if exists "sellers can insert their own product units" on public.product_units;
    create policy "sellers can insert their own product units"
      on public.product_units for insert
      with check (
        exists (
          select 1
          from public.products p
          where p.id = product_id
            and (
              (p.seller_id = auth.uid() and public.is_approved_seller(auth.uid()))
              or public.is_admin(auth.uid())
            )
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
            and (
              (p.seller_id = auth.uid() and public.is_approved_seller(auth.uid()))
              or public.is_admin(auth.uid())
            )
        )
      )
      with check (
        exists (
          select 1
          from public.products p
          where p.id = product_id
            and (
              (p.seller_id = auth.uid() and public.is_approved_seller(auth.uid()))
              or public.is_admin(auth.uid())
            )
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

    drop policy if exists "sellers and admins can update related orders" on public.orders;
    create policy "sellers and admins can update related orders"
      on public.orders for update
      using (
        public.is_admin(auth.uid())
        or exists (
          select 1
          from public.products p
          where p.id = product_id and p.seller_id = auth.uid()
        )
      )
      with check (
        public.is_admin(auth.uid())
        or exists (
          select 1
          from public.products p
          where p.id = product_id and p.seller_id = auth.uid()
        )
      );

    drop policy if exists "customers can insert orders" on public.orders;
    create policy "customers can insert orders"
      on public.orders for insert
      with check (
        buyer_id = auth.uid()
        and exists (
          select 1 from public.users
          where id = auth.uid() and role = 'customer'
        )
      );


create schema if not exists marketplace;

grant usage on schema marketplace to anon, authenticated, service_role;

-- Existing databases that already have marketplace.order_status from an older version
-- must run `supabase/2026_04_11_marketplace_order_status_enum_upgrade.sql`
-- in a separate SQL execution before running this file.

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'fulfillment_type' and typnamespace = 'marketplace'::regnamespace
  ) then
    create type marketplace.fulfillment_type as enum ('seller', 'platform');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'listing_condition' and typnamespace = 'marketplace'::regnamespace
  ) then
    create type marketplace.listing_condition as enum ('new', 'refurbished', 'used');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'listing_status' and typnamespace = 'marketplace'::regnamespace
  ) then
    create type marketplace.listing_status as enum ('draft', 'active', 'inactive', 'archived');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'order_status' and typnamespace = 'marketplace'::regnamespace
  ) then
    create type marketplace.order_status as enum (
      'placed',
      'confirmed',
      'packed',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'returned'
    );
  end if;
end $$;

create or replace function marketplace.touch_updated_at()
returns trigger
language plpgsql
set search_path = marketplace, public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function marketplace.generate_reference(prefix text)
returns text
language sql
stable
set search_path = marketplace, public
as $$
  select prefix || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
$$;

create or replace function marketplace.normalize_reference_token(raw_value text, fallback_value text default 'USER')
returns text
language plpgsql
immutable
set search_path = marketplace, public
as $$
declare
  normalized text;
begin
  normalized := upper(regexp_replace(coalesce(raw_value, ''), '[^A-Za-z0-9]+', '', 'g'));

  if normalized is null or normalized = '' then
    normalized := upper(regexp_replace(coalesce(fallback_value, 'USER'), '[^A-Za-z0-9]+', '', 'g'));
  end if;

  if normalized is null or normalized = '' then
    normalized := 'USER';
  end if;

  return left(normalized, 12);
end;
$$;

create or replace function marketplace.generate_order_id(buyer_uuid uuid)
returns text
language plpgsql
set search_path = marketplace, public
as $$
declare
  username_token text;
  date_token text := to_char(timezone('utc', now()), 'YYYYMMDD');
  random_suffix text;
  candidate text;
  attempt_count integer := 0;
begin
  select marketplace.normalize_reference_token(
    coalesce(nullif(u.full_name, ''), nullif(split_part(u.email, '@', 1), ''), left(u.id::text, 8)),
    'USER'
  )
  into username_token
  from public.users u
  where u.id = buyer_uuid;

  if username_token is null or username_token = '' then
    username_token := 'USER';
  end if;

  loop
    random_suffix := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));
    candidate := 'ORD-' || username_token || '-' || date_token || '-' || random_suffix;

    exit when not exists (
      select 1
      from marketplace.orders
      where order_id = candidate
    );

    attempt_count := attempt_count + 1;

    if attempt_count > 25 then
      raise exception 'Unable to generate a unique order ID.';
    end if;
  end loop;

  return candidate;
end;
$$;

create or replace function marketplace.order_status_rank(status_value marketplace.order_status)
returns integer
language sql
immutable
set search_path = marketplace, public
as $$
  select case status_value
    when 'placed' then 1
    when 'confirmed' then 2
    when 'packed' then 3
    when 'shipped' then 4
    when 'out_for_delivery' then 5
    when 'delivered' then 6
    when 'cancelled' then 90
    when 'returned' then 91
    else 0
  end;
$$;

create or replace function marketplace.order_has_seller_access(order_uuid uuid, user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = marketplace, public
as $$
  select exists (
    select 1
    from marketplace.order_suborders
    where order_id = order_uuid
      and seller_id = user_uuid
  );
$$;

create or replace function marketplace.suborder_has_buyer_access(sub_order_uuid uuid, user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = marketplace, public
as $$
  select exists (
    select 1
    from marketplace.order_suborders so
    join marketplace.orders o on o.id = so.order_id
    where so.id = sub_order_uuid
      and o.buyer_id = user_uuid
  );
$$;

create or replace function marketplace.order_item_has_buyer_access(order_item_uuid uuid, user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = marketplace, public
as $$
  select exists (
    select 1
    from marketplace.order_items oi
    join marketplace.orders o on o.id = oi.order_id
    where oi.id = order_item_uuid
      and o.buyer_id = user_uuid
  );
$$;

create table if not exists marketplace.sellers (
  id uuid primary key references public.users (id) on delete cascade,
  email text not null unique,
  display_name text,
  business_name text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists marketplace.products (
  id uuid primary key default gen_random_uuid(),
  custom_product_id text,
  name text not null,
  brand text not null,
  category_id uuid references public.categories (id) on delete set null,
  description text not null,
  primary_image_url text,
  gallery_image_urls text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references marketplace.sellers (id) on delete set null,
  search_document tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(brand, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'C')
  ) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table marketplace.products add column if not exists custom_product_id text;
alter table marketplace.products add column if not exists gallery_image_urls text[] not null default '{}'::text[];

create table if not exists marketplace.variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references marketplace.products (id) on delete cascade,
  custom_variant_id text,
  name text not null,
  size text,
  color text,
  barcode text,
  attributes jsonb not null default '{}'::jsonb,
  qr_target_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table marketplace.variants add column if not exists custom_variant_id text;

create table if not exists marketplace.listings (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references marketplace.variants (id) on delete cascade,
  seller_id uuid not null references marketplace.sellers (id) on delete cascade,
  seller_sku text not null,
  price numeric(12, 2) not null check (price >= 0),
  mrp numeric(12, 2) not null check (mrp >= 0 and mrp >= price),
  currency_code text not null default 'INR',
  stock_on_hand integer not null default 0 check (stock_on_hand >= 0),
  reserved_stock integer not null default 0 check (reserved_stock >= 0 and reserved_stock <= stock_on_hand),
  available_stock integer generated always as (greatest(stock_on_hand - reserved_stock, 0)) stored,
  fulfillment_type marketplace.fulfillment_type not null default 'seller',
  delivery_min_days integer not null default 1 check (delivery_min_days >= 0),
  delivery_max_days integer not null default 7 check (delivery_max_days >= delivery_min_days),
  gst_percentage numeric(5, 2) not null default 0 check (gst_percentage >= 0 and gst_percentage <= 100),
  condition marketplace.listing_condition not null default 'new',
  status marketplace.listing_status not null default 'active',
  qr_target_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists marketplace.orders (
  id uuid primary key default gen_random_uuid(),
  order_id text unique,
  order_number text not null unique,
  buyer_id uuid not null references public.users (id) on delete restrict,
  status marketplace.order_status not null default 'placed',
  currency_code text not null default 'INR',
  subtotal_amount numeric(12, 2) not null default 0 check (subtotal_amount >= 0),
  shipping_amount numeric(12, 2) not null default 0 check (shipping_amount >= 0),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  shipping_address jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table marketplace.orders add column if not exists order_id text;

create table if not exists marketplace.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  listing_id uuid not null references marketplace.listings (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, listing_id)
);

create table if not exists marketplace.order_suborders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references marketplace.orders (id) on delete cascade,
  seller_id uuid not null references marketplace.sellers (id) on delete restrict,
  sub_order_number text not null unique,
  status marketplace.order_status not null default 'placed',
  fulfillment_type marketplace.fulfillment_type not null default 'seller',
  subtotal_amount numeric(12, 2) not null default 0 check (subtotal_amount >= 0),
  shipping_amount numeric(12, 2) not null default 0 check (shipping_amount >= 0),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (order_id, seller_id)
);

create table if not exists marketplace.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references marketplace.orders (id) on delete cascade,
  sub_order_id uuid not null references marketplace.order_suborders (id) on delete cascade,
  seller_id uuid not null references marketplace.sellers (id) on delete restrict,
  listing_id uuid not null references marketplace.listings (id) on delete restrict,
  product_id uuid not null references marketplace.products (id) on delete restrict,
  variant_id uuid not null references marketplace.variants (id) on delete restrict,
  seller_sku text not null,
  product_name text not null,
  variant_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  line_total numeric(12, 2) generated always as ((quantity::numeric) * unit_price) stored,
  status marketplace.order_status not null default 'placed',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists marketplace.order_tracking (
  tracking_id uuid primary key default gen_random_uuid(),
  order_id uuid not null references marketplace.orders (id) on delete cascade,
  status marketplace.order_status not null,
  timestamp timestamptz not null default timezone('utc', now()),
  updated_by text not null default 'system'
);

create unique index if not exists idx_marketplace_products_creator_custom_product_id
  on marketplace.products (created_by, custom_product_id)
  where custom_product_id is not null;

create unique index if not exists idx_marketplace_variants_product_custom_variant_id
  on marketplace.variants (product_id, custom_variant_id)
  where custom_variant_id is not null;

create unique index if not exists idx_marketplace_variants_product_name
  on marketplace.variants (product_id, name);

create unique index if not exists idx_marketplace_variants_barcode
  on marketplace.variants (barcode)
  where barcode is not null;

create unique index if not exists idx_marketplace_listings_seller_sku
  on marketplace.listings (seller_id, seller_sku);

create unique index if not exists idx_marketplace_orders_order_id
  on marketplace.orders (order_id)
  where order_id is not null;

create index if not exists idx_marketplace_products_category
  on marketplace.products (category_id);

create index if not exists idx_marketplace_products_brand
  on marketplace.products (brand);

create index if not exists idx_marketplace_products_search
  on marketplace.products using gin (search_document);

create index if not exists idx_marketplace_variants_product
  on marketplace.variants (product_id);

create index if not exists idx_marketplace_listings_variant_status_price
  on marketplace.listings (variant_id, status, price);

create index if not exists idx_marketplace_listings_seller_status
  on marketplace.listings (seller_id, status);

create index if not exists idx_marketplace_listings_available_stock
  on marketplace.listings (available_stock);

create index if not exists idx_marketplace_cart_items_user
  on marketplace.cart_items (user_id, created_at desc);

create index if not exists idx_marketplace_cart_items_listing
  on marketplace.cart_items (listing_id);

create index if not exists idx_marketplace_orders_buyer
  on marketplace.orders (buyer_id, created_at desc);

create index if not exists idx_marketplace_suborders_order
  on marketplace.order_suborders (order_id, seller_id);

create index if not exists idx_marketplace_suborders_seller
  on marketplace.order_suborders (seller_id, created_at desc);

create index if not exists idx_marketplace_order_items_order
  on marketplace.order_items (order_id);

create index if not exists idx_marketplace_order_items_sub_order
  on marketplace.order_items (sub_order_id);

create index if not exists idx_marketplace_order_items_listing
  on marketplace.order_items (listing_id);

create index if not exists idx_marketplace_order_items_variant
  on marketplace.order_items (variant_id);

create index if not exists idx_marketplace_order_tracking_order
  on marketplace.order_tracking (order_id, timestamp desc);

create or replace function marketplace.sync_seller_profile()
returns trigger
language plpgsql
security definer
set search_path = marketplace, public
as $$
begin
  if new.role in ('seller', 'admin') then
    insert into marketplace.sellers (
      id,
      email,
      display_name,
      business_name,
      is_active
    )
    values (
      new.id,
      new.email,
      coalesce(new.spoc_name, new.full_name, split_part(new.email, '@', 1)),
      coalesce(new.business_name, new.full_name),
      case
        when new.role = 'admin' then true
        else new.account_status = 'approved'
      end
    )
    on conflict (id) do update
      set email = excluded.email,
          display_name = excluded.display_name,
          business_name = excluded.business_name,
          is_active = excluded.is_active,
          updated_at = timezone('utc', now());
  else
    update marketplace.sellers
    set is_active = false,
        updated_at = timezone('utc', now())
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists marketplace_sync_seller_profile on public.users;
create trigger marketplace_sync_seller_profile
  after insert or update on public.users
  for each row execute procedure marketplace.sync_seller_profile();

insert into marketplace.sellers (id, email, display_name, business_name, is_active)
select
  u.id,
  u.email,
  coalesce(u.spoc_name, u.full_name, split_part(u.email, '@', 1)),
  coalesce(u.business_name, u.full_name),
  case
    when u.role = 'admin' then true
    else u.account_status = 'approved'
  end
from public.users u
where u.role in ('seller', 'admin')
on conflict (id) do update
  set email = excluded.email,
      display_name = excluded.display_name,
      business_name = excluded.business_name,
      is_active = excluded.is_active,
      updated_at = timezone('utc', now());

create or replace function marketplace.set_variant_qr_target()
returns trigger
language plpgsql
set search_path = marketplace, public
as $$
begin
  if new.qr_target_path is null or btrim(new.qr_target_path) = '' then
    new.qr_target_path := '/marketplace/variants/' || new.id::text;
  end if;

  return new;
end;
$$;

create or replace function marketplace.set_listing_qr_target()
returns trigger
language plpgsql
set search_path = marketplace, public
as $$
begin
  if new.qr_target_path is null or btrim(new.qr_target_path) = '' then
    new.qr_target_path := '/marketplace/listings/' || new.id::text;
  end if;

  return new;
end;
$$;

create or replace function marketplace.set_order_identifiers()
returns trigger
language plpgsql
set search_path = marketplace, public
as $$
begin
  if new.order_id is null or btrim(new.order_id) = '' then
    new.order_id := marketplace.generate_order_id(new.buyer_id);
  end if;

  if new.order_number is null or btrim(new.order_number) = '' then
    new.order_number := new.order_id;
  end if;

  return new;
end;
$$;

create or replace function marketplace.set_sub_order_number()
returns trigger
language plpgsql
set search_path = marketplace, public
as $$
begin
  if new.sub_order_number is null or btrim(new.sub_order_number) = '' then
    new.sub_order_number := marketplace.generate_reference('SUB');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_marketplace_sellers_updated_at on marketplace.sellers;
create trigger trg_marketplace_sellers_updated_at
  before update on marketplace.sellers
  for each row execute procedure marketplace.touch_updated_at();

drop trigger if exists trg_marketplace_products_updated_at on marketplace.products;
create trigger trg_marketplace_products_updated_at
  before update on marketplace.products
  for each row execute procedure marketplace.touch_updated_at();

drop trigger if exists trg_marketplace_variants_updated_at on marketplace.variants;
create trigger trg_marketplace_variants_updated_at
  before update on marketplace.variants
  for each row execute procedure marketplace.touch_updated_at();

drop trigger if exists trg_marketplace_listings_updated_at on marketplace.listings;
create trigger trg_marketplace_listings_updated_at
  before update on marketplace.listings
  for each row execute procedure marketplace.touch_updated_at();

drop trigger if exists trg_marketplace_cart_items_updated_at on marketplace.cart_items;
create trigger trg_marketplace_cart_items_updated_at
  before update on marketplace.cart_items
  for each row execute procedure marketplace.touch_updated_at();

drop trigger if exists trg_marketplace_orders_updated_at on marketplace.orders;
create trigger trg_marketplace_orders_updated_at
  before update on marketplace.orders
  for each row execute procedure marketplace.touch_updated_at();

drop trigger if exists trg_marketplace_suborders_updated_at on marketplace.order_suborders;
create trigger trg_marketplace_suborders_updated_at
  before update on marketplace.order_suborders
  for each row execute procedure marketplace.touch_updated_at();

drop trigger if exists trg_marketplace_order_items_updated_at on marketplace.order_items;
create trigger trg_marketplace_order_items_updated_at
  before update on marketplace.order_items
  for each row execute procedure marketplace.touch_updated_at();

drop trigger if exists trg_marketplace_variants_qr on marketplace.variants;
create trigger trg_marketplace_variants_qr
  before insert on marketplace.variants
  for each row execute procedure marketplace.set_variant_qr_target();

drop trigger if exists trg_marketplace_listings_qr on marketplace.listings;
create trigger trg_marketplace_listings_qr
  before insert on marketplace.listings
  for each row execute procedure marketplace.set_listing_qr_target();

drop trigger if exists trg_marketplace_orders_number on marketplace.orders;
drop trigger if exists trg_marketplace_orders_identifiers on marketplace.orders;
create trigger trg_marketplace_orders_identifiers
  before insert on marketplace.orders
  for each row execute procedure marketplace.set_order_identifiers();

drop trigger if exists trg_marketplace_suborders_number on marketplace.order_suborders;
create trigger trg_marketplace_suborders_number
  before insert on marketplace.order_suborders
  for each row execute procedure marketplace.set_sub_order_number();

update marketplace.orders
set order_id = marketplace.generate_order_id(buyer_id)
where order_id is null or btrim(order_id) = '';

update marketplace.orders
set order_number = order_id
where order_number is null or btrim(order_number) = '';

drop function if exists marketplace.refresh_order_status(uuid);
drop function if exists marketplace.refresh_order_status(uuid, text);

create or replace function marketplace.record_order_tracking(
  order_uuid uuid,
  next_status marketplace.order_status,
  actor_label text default 'system'
)
returns void
language plpgsql
security definer
set search_path = marketplace, public
as $$
declare
  previous_status marketplace.order_status;
begin
  select ot.status
  into previous_status
  from marketplace.order_tracking ot
  where ot.order_id = order_uuid
  order by ot.timestamp desc
  limit 1;

  if previous_status is not null and previous_status = next_status then
    return;
  end if;

  insert into marketplace.order_tracking (order_id, status, updated_by)
  values (order_uuid, next_status, coalesce(nullif(actor_label, ''), 'system'));
end;
$$;

create or replace function marketplace.refresh_order_status(
  order_uuid uuid,
  actor_label text default 'system'
)
returns marketplace.order_status
language plpgsql
security definer
set search_path = marketplace, public
as $$
declare
  derived_status marketplace.order_status;
  current_status marketplace.order_status;
begin
  select status
  into current_status
  from marketplace.orders
  where id = order_uuid
  for update;

  select
    case
      when count(*) = 0 then 'placed'::marketplace.order_status
      when bool_and(status = 'cancelled') then 'cancelled'::marketplace.order_status
      when bool_and(status = 'returned') then 'returned'::marketplace.order_status
      when bool_and(status = 'delivered') then 'delivered'::marketplace.order_status
      when bool_or(status = 'out_for_delivery') then 'out_for_delivery'::marketplace.order_status
      when bool_or(status = 'shipped') then 'shipped'::marketplace.order_status
      when bool_or(status = 'packed') then 'packed'::marketplace.order_status
      when bool_or(status = 'confirmed') then 'confirmed'::marketplace.order_status
      else 'placed'::marketplace.order_status
    end
  into derived_status
  from marketplace.order_suborders
  where order_id = order_uuid;

  update marketplace.orders
  set status = coalesce(derived_status, 'placed'::marketplace.order_status),
      updated_at = timezone('utc', now())
  where id = order_uuid;

  if current_status is distinct from derived_status then
    perform marketplace.record_order_tracking(
      order_uuid,
      coalesce(derived_status, 'placed'::marketplace.order_status),
      actor_label
    );
  end if;

  return coalesce(derived_status, 'placed'::marketplace.order_status);
end;
$$;

create or replace function marketplace.refresh_order_status(order_uuid uuid)
returns marketplace.order_status
language sql
security definer
set search_path = marketplace, public
as $$
  select marketplace.refresh_order_status(order_uuid, 'system');
$$;

create or replace function marketplace.create_order(
  buyer_uuid uuid,
  items_json jsonb,
  shipping_address_json jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = marketplace, public
as $$
declare
  order_uuid uuid := gen_random_uuid();
  cart_item jsonb;
  listing_uuid uuid;
  quantity_int integer;
  listing_record record;
  sub_order_uuid uuid;
  line_subtotal numeric(12, 2);
  order_subtotal numeric(12, 2) := 0;
begin
  if auth.uid() is distinct from buyer_uuid then
    raise exception 'You can only place orders as the authenticated buyer.';
  end if;

  if jsonb_typeof(items_json) is distinct from 'array' or jsonb_array_length(items_json) = 0 then
    raise exception 'At least one listing is required to place an order.';
  end if;

  if not exists (
    select 1
    from public.users
    where id = buyer_uuid and role = 'customer'
  ) then
    raise exception 'Only customer accounts can place marketplace orders.';
  end if;

  insert into marketplace.orders (
    id,
    buyer_id,
    shipping_address,
    status
  )
  values (
    order_uuid,
    buyer_uuid,
    shipping_address_json,
    'placed'
  );

  perform marketplace.record_order_tracking(order_uuid, 'placed', 'system');

  for cart_item in
    select value
    from jsonb_array_elements(items_json)
  loop
    listing_uuid := nullif(cart_item ->> 'listing_id', '')::uuid;
    quantity_int := coalesce(nullif(cart_item ->> 'quantity', '')::integer, 0);

    if listing_uuid is null then
      raise exception 'Each order item must include a listing_id.';
    end if;

    if quantity_int < 1 then
      raise exception 'Each order item quantity must be at least 1.';
    end if;

    select
      l.id,
      l.variant_id,
      l.seller_id,
      l.seller_sku,
      l.price,
      l.fulfillment_type,
      l.status,
      l.available_stock,
      s.is_active,
      v.product_id,
      v.name as variant_name,
      p.name as product_name
    into listing_record
    from marketplace.listings l
    join marketplace.sellers s on s.id = l.seller_id
    join marketplace.variants v on v.id = l.variant_id
    join marketplace.products p on p.id = v.product_id
    where l.id = listing_uuid
    for update of l;

    if not found then
      raise exception 'Listing % was not found.', listing_uuid;
    end if;

    if listing_record.status <> 'active' then
      raise exception 'Listing % is not active.', listing_uuid;
    end if;

    if not listing_record.is_active then
      raise exception 'Listing % is not available because the seller is not currently active.', listing_uuid;
    end if;

    if listing_record.available_stock < quantity_int then
      raise exception 'Listing % only has % unit(s) available.', listing_uuid, listing_record.available_stock;
    end if;

    update marketplace.listings
    set stock_on_hand = stock_on_hand - quantity_int,
        updated_at = timezone('utc', now())
    where id = listing_uuid;

    select id
    into sub_order_uuid
    from marketplace.order_suborders
    where order_id = order_uuid
      and seller_id = listing_record.seller_id;

    if sub_order_uuid is null then
      insert into marketplace.order_suborders (
        order_id,
        seller_id,
        status,
        fulfillment_type
      )
      values (
        order_uuid,
        listing_record.seller_id,
        'placed',
        listing_record.fulfillment_type
      )
      returning id into sub_order_uuid;
    end if;

    line_subtotal := listing_record.price * quantity_int;
    order_subtotal := order_subtotal + line_subtotal;

    insert into marketplace.order_items (
      order_id,
      sub_order_id,
      seller_id,
      listing_id,
      product_id,
      variant_id,
      seller_sku,
      product_name,
      variant_name,
      quantity,
      unit_price,
      status
    )
    values (
      order_uuid,
      sub_order_uuid,
      listing_record.seller_id,
      listing_uuid,
      listing_record.product_id,
      listing_record.variant_id,
      listing_record.seller_sku,
      listing_record.product_name,
      listing_record.variant_name,
      quantity_int,
      listing_record.price,
      'placed'
    );

    update marketplace.order_suborders
    set subtotal_amount = subtotal_amount + line_subtotal,
        total_amount = subtotal_amount + shipping_amount + line_subtotal,
        updated_at = timezone('utc', now())
    where id = sub_order_uuid;
  end loop;

  update marketplace.orders
  set subtotal_amount = order_subtotal,
      total_amount = order_subtotal + shipping_amount,
      updated_at = timezone('utc', now())
  where id = order_uuid;

  perform marketplace.refresh_order_status(order_uuid, 'system');

  return order_uuid;
end;
$$;

create or replace function marketplace.cancel_order(
  order_uuid uuid,
  buyer_uuid uuid
)
returns void
language plpgsql
security definer
set search_path = marketplace, public
as $$
declare
  cancellable boolean;
begin
  if auth.uid() is distinct from buyer_uuid then
    raise exception 'You can only cancel your own marketplace orders.';
  end if;

  if not exists (
    select 1
    from marketplace.orders
    where id = order_uuid
      and buyer_id = buyer_uuid
  ) then
    raise exception 'Marketplace order not found.';
  end if;

  select not exists (
    select 1
    from marketplace.order_suborders
    where order_id = order_uuid
      and status in ('shipped', 'out_for_delivery', 'delivered', 'returned')
  )
  into cancellable;

  if not cancellable then
    raise exception 'Only orders that have not shipped can be cancelled.';
  end if;

  update marketplace.listings l
  set stock_on_hand = l.stock_on_hand + oi.quantity,
      updated_at = timezone('utc', now())
  from marketplace.order_items oi
  where oi.order_id = order_uuid
    and oi.status not in ('cancelled', 'returned')
    and oi.listing_id = l.id;

  update marketplace.order_items
  set status = 'cancelled',
      updated_at = timezone('utc', now())
  where order_id = order_uuid
    and status <> 'cancelled';

  update marketplace.order_suborders
  set status = 'cancelled',
      updated_at = timezone('utc', now())
  where order_id = order_uuid
    and status <> 'cancelled';

  perform marketplace.refresh_order_status(order_uuid, 'customer');
end;
$$;

create or replace function marketplace.update_suborder_status(
  sub_order_uuid uuid,
  next_status marketplace.order_status
)
returns void
language plpgsql
security definer
set search_path = marketplace, public
as $$
declare
  current_status marketplace.order_status;
  seller_uuid uuid;
  parent_order_uuid uuid;
  actor_label text := case when public.is_admin(auth.uid()) then 'admin' else 'seller' end;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;

  select seller_id, status, order_id
  into seller_uuid, current_status, parent_order_uuid
  from marketplace.order_suborders
  where id = sub_order_uuid
  for update;

  if not found then
    raise exception 'Sub-order not found.';
  end if;

  if not (public.is_admin(auth.uid()) or auth.uid() = seller_uuid) then
    raise exception 'You are not allowed to update this sub-order.';
  end if;

  if current_status = 'cancelled' and next_status <> 'cancelled' then
    raise exception 'Cancelled sub-orders cannot be reopened.';
  end if;

  if current_status = 'returned' and next_status <> 'returned' then
    raise exception 'Returned sub-orders cannot be reopened.';
  end if;

  if next_status = 'returned' and current_status <> 'delivered' then
    raise exception 'Only delivered sub-orders can be marked returned.';
  end if;

  if next_status = 'cancelled' and current_status in ('delivered', 'returned') then
    raise exception 'Delivered or returned sub-orders cannot be cancelled.';
  end if;

  if next_status not in ('cancelled', 'returned')
     and marketplace.order_status_rank(next_status) < marketplace.order_status_rank(current_status) then
    raise exception 'Sub-order statuses cannot move backwards.';
  end if;

  if next_status = 'cancelled' and current_status <> 'cancelled' then
    update marketplace.listings l
    set stock_on_hand = l.stock_on_hand + oi.quantity,
        updated_at = timezone('utc', now())
    from marketplace.order_items oi
    where oi.sub_order_id = sub_order_uuid
      and oi.status <> 'cancelled'
      and oi.listing_id = l.id;
  end if;

  update marketplace.order_suborders
  set status = next_status,
      updated_at = timezone('utc', now())
  where id = sub_order_uuid;

  update marketplace.order_items
  set status = next_status,
      updated_at = timezone('utc', now())
  where sub_order_id = sub_order_uuid;

  perform marketplace.refresh_order_status(parent_order_uuid, actor_label);
end;
$$;

grant select on all tables in schema marketplace to anon, authenticated;
grant insert, update, delete on all tables in schema marketplace to authenticated;
grant execute on function marketplace.create_order(uuid, jsonb, jsonb) to authenticated;
grant execute on function marketplace.cancel_order(uuid, uuid) to authenticated;
grant execute on function marketplace.update_suborder_status(uuid, marketplace.order_status) to authenticated;
grant execute on function marketplace.refresh_order_status(uuid, text) to authenticated;
grant execute on function marketplace.refresh_order_status(uuid) to authenticated;
grant execute on function marketplace.record_order_tracking(uuid, marketplace.order_status, text) to authenticated;
grant execute on function marketplace.order_has_seller_access(uuid, uuid) to authenticated;
grant execute on function marketplace.suborder_has_buyer_access(uuid, uuid) to authenticated;
grant execute on function marketplace.order_item_has_buyer_access(uuid, uuid) to authenticated;

alter table marketplace.sellers enable row level security;
alter table marketplace.products enable row level security;
alter table marketplace.variants enable row level security;
alter table marketplace.listings enable row level security;
alter table marketplace.cart_items enable row level security;
alter table marketplace.orders enable row level security;
alter table marketplace.order_suborders enable row level security;
alter table marketplace.order_items enable row level security;
alter table marketplace.order_tracking enable row level security;

drop policy if exists "public can view marketplace sellers" on marketplace.sellers;
create policy "public can view marketplace sellers"
  on marketplace.sellers for select
  using (true);

drop policy if exists "sellers can manage their marketplace profile" on marketplace.sellers;
create policy "sellers can manage their marketplace profile"
  on marketplace.sellers for update
  using (id = auth.uid() or public.is_admin(auth.uid()))
  with check (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "public can view marketplace products" on marketplace.products;
create policy "public can view marketplace products"
  on marketplace.products for select
  using (true);

drop policy if exists "sellers can insert marketplace products" on marketplace.products;
create policy "sellers can insert marketplace products"
  on marketplace.products for insert
  with check (
    created_by = auth.uid()
    and public.is_approved_seller(auth.uid())
  );

drop policy if exists "product creators can update marketplace products" on marketplace.products;
create policy "product creators can update marketplace products"
  on marketplace.products for update
  using (
    (created_by = auth.uid() and public.is_approved_seller(auth.uid()))
    or public.is_admin(auth.uid())
  )
  with check (
    (created_by = auth.uid() and public.is_approved_seller(auth.uid()))
    or public.is_admin(auth.uid())
  );

drop policy if exists "product creators can delete marketplace products" on marketplace.products;
create policy "product creators can delete marketplace products"
  on marketplace.products for delete
  using (
    (created_by = auth.uid() and public.is_approved_seller(auth.uid()))
    or public.is_admin(auth.uid())
  );

drop policy if exists "public can view marketplace variants" on marketplace.variants;
create policy "public can view marketplace variants"
  on marketplace.variants for select
  using (true);

drop policy if exists "product creators can manage marketplace variants" on marketplace.variants;
create policy "product creators can manage marketplace variants"
  on marketplace.variants for all
  using (
    public.is_admin(auth.uid())
    or (
      public.is_approved_seller(auth.uid())
      and exists (
        select 1
        from marketplace.products p
        where p.id = product_id
          and p.created_by = auth.uid()
      )
    )
  )
  with check (
    public.is_admin(auth.uid())
    or (
      public.is_approved_seller(auth.uid())
      and exists (
        select 1
        from marketplace.products p
        where p.id = product_id
          and p.created_by = auth.uid()
      )
    )
  );

drop policy if exists "public can view active marketplace listings" on marketplace.listings;
create policy "public can view active marketplace listings"
  on marketplace.listings for select
  using (
    (
      status = 'active'
      and exists (
        select 1
        from marketplace.sellers s
        where s.id = seller_id
          and s.is_active
      )
    )
    or seller_id = auth.uid()
    or public.is_admin(auth.uid())
  );

drop policy if exists "sellers can manage their marketplace listings" on marketplace.listings;
create policy "sellers can manage their marketplace listings"
  on marketplace.listings for all
  using (
    (seller_id = auth.uid() and public.is_approved_seller(auth.uid()))
    or public.is_admin(auth.uid())
  )
  with check (
    (seller_id = auth.uid() and public.is_approved_seller(auth.uid()))
    or public.is_admin(auth.uid())
  );

drop policy if exists "customers can manage their marketplace cart" on marketplace.cart_items;
create policy "customers can manage their marketplace cart"
  on marketplace.cart_items for all
  using (user_id = auth.uid() or public.is_admin(auth.uid()))
  with check (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "buyers sellers and admins can view marketplace orders" on marketplace.orders;
create policy "buyers sellers and admins can view marketplace orders"
  on marketplace.orders for select
  using (
    buyer_id = auth.uid()
    or public.is_admin(auth.uid())
    or marketplace.order_has_seller_access(id, auth.uid())
  );

drop policy if exists "buyers can insert marketplace orders" on marketplace.orders;
create policy "buyers can insert marketplace orders"
  on marketplace.orders for insert
  with check (
    buyer_id = auth.uid()
    and exists (
      select 1
      from public.users
      where id = auth.uid()
        and role = 'customer'
    )
  );

drop policy if exists "buyers and admins can update their marketplace orders" on marketplace.orders;
create policy "buyers and admins can update their marketplace orders"
  on marketplace.orders for update
  using (buyer_id = auth.uid() or public.is_admin(auth.uid()))
  with check (buyer_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "buyers sellers and admins can view marketplace suborders" on marketplace.order_suborders;
create policy "buyers sellers and admins can view marketplace suborders"
  on marketplace.order_suborders for select
  using (
    seller_id = auth.uid()
    or public.is_admin(auth.uid())
    or marketplace.suborder_has_buyer_access(id, auth.uid())
  );

drop policy if exists "sellers and admins can update marketplace suborders" on marketplace.order_suborders;
create policy "sellers and admins can update marketplace suborders"
  on marketplace.order_suborders for update
  using (seller_id = auth.uid() or public.is_admin(auth.uid()))
  with check (seller_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "buyers sellers and admins can view marketplace order items" on marketplace.order_items;
create policy "buyers sellers and admins can view marketplace order items"
  on marketplace.order_items for select
  using (
    seller_id = auth.uid()
    or public.is_admin(auth.uid())
    or marketplace.order_item_has_buyer_access(id, auth.uid())
  );

drop policy if exists "sellers and admins can update marketplace order items" on marketplace.order_items;
create policy "sellers and admins can update marketplace order items"
  on marketplace.order_items for update
  using (seller_id = auth.uid() or public.is_admin(auth.uid()))
  with check (seller_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "buyers sellers and admins can view marketplace order tracking" on marketplace.order_tracking;
create policy "buyers sellers and admins can view marketplace order tracking"
  on marketplace.order_tracking for select
  using (
    exists (
      select 1
      from marketplace.orders o
      where o.id = marketplace.order_tracking.order_id
        and (
          o.buyer_id = auth.uid()
          or public.is_admin(auth.uid())
          or marketplace.order_has_seller_access(o.id, auth.uid())
        )
    )
  );
