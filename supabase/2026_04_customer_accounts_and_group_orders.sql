alter table public.users add column if not exists full_name text;
alter table public.users add column if not exists mobile_number text;
alter table public.users add column if not exists address text;

alter table public.orders add column if not exists order_group_id uuid not null default gen_random_uuid();
create index if not exists idx_orders_order_group_id on public.orders (order_group_id);

create or replace function public.place_order(product_uuid uuid, buyer_uuid uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
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

drop policy if exists "users can update themselves or admins can update all users" on public.users;
create policy "users can update themselves or admins can update all users"
  on public.users for update
  using (auth.uid() = id or public.is_admin(auth.uid()))
  with check (auth.uid() = id or public.is_admin(auth.uid()));

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
