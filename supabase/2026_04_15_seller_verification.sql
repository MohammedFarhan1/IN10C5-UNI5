do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'account_status' and typnamespace = 'public'::regnamespace
  ) then
    create type public.account_status as enum ('pending', 'approved', 'rejected');
  end if;
end $$;

alter table public.users
  add column if not exists business_name text,
  add column if not exists spoc_name text,
  add column if not exists cin text,
  add column if not exists gst text,
  add column if not exists trademark_url text,
  add column if not exists document_url text,
  add column if not exists account_status public.account_status not null default 'approved';

update public.users
set account_status = 'approved'
where account_status is null;

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
