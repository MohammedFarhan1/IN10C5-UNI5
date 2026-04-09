alter table public.categories enable row level security;

drop policy if exists "public can view categories" on public.categories;
create policy "public can view categories"
  on public.categories for select
  using (true);

drop policy if exists "sellers and admins can insert categories" on public.categories;
create policy "sellers and admins can insert categories"
  on public.categories for insert
  with check (
    exists (
      select 1
      from public.users
      where id = auth.uid()
        and role in ('seller', 'admin')
    )
  );

drop policy if exists "admins can update categories" on public.categories;
create policy "admins can update categories"
  on public.categories for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "admins can delete categories" on public.categories;
create policy "admins can delete categories"
  on public.categories for delete
  using (public.is_admin(auth.uid()));
