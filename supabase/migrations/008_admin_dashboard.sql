-- ═══════════════════════════════════════════════════════════════════════════
-- Viale — Admin Dashboard Security + Catalogue Pricing
-- Run this after the previous migrations. Then insert your user id into
-- public.admin_users from the Supabase SQL editor.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.admin_users (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  role       text        not null default 'admin' check (role in ('admin', 'owner')),
  created_at timestamptz not null default now(),

  constraint admin_users_pkey primary key (user_id)
);

alter table public.admin_users enable row level security;

drop policy if exists "admin_users_select_own" on public.admin_users;
create policy "admin_users_select_own"
  on public.admin_users for select
  using (auth.uid() = user_id);

alter table public.products
  add column if not exists discount_price numeric(8,2) check (discount_price is null or discount_price >= 0),
  add column if not exists source_import_id uuid references public.perfume_imports (id) on delete set null;

-- Admin access helper. Security definer avoids recursive policy checks.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_users
    where admin_users.user_id = uid
  );
$$;

-- Products: public can read active rows from earlier policy; admins can manage all.
drop policy if exists "products_select_admin" on public.products;
create policy "products_select_admin"
  on public.products for select
  using (public.is_admin(auth.uid()));

drop policy if exists "products_insert_admin" on public.products;
create policy "products_insert_admin"
  on public.products for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "products_update_admin" on public.products;
create policy "products_update_admin"
  on public.products for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "products_delete_admin" on public.products;
create policy "products_delete_admin"
  on public.products for delete
  using (public.is_admin(auth.uid()));

-- Collections.
drop policy if exists "collections_select_admin" on public.collections;
create policy "collections_select_admin"
  on public.collections for select
  using (public.is_admin(auth.uid()));

drop policy if exists "collections_insert_admin" on public.collections;
create policy "collections_insert_admin"
  on public.collections for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "collections_update_admin" on public.collections;
create policy "collections_update_admin"
  on public.collections for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "collections_delete_admin" on public.collections;
create policy "collections_delete_admin"
  on public.collections for delete
  using (public.is_admin(auth.uid()));

drop policy if exists "collection_items_insert_admin" on public.collection_items;
create policy "collection_items_insert_admin"
  on public.collection_items for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "collection_items_update_admin" on public.collection_items;
create policy "collection_items_update_admin"
  on public.collection_items for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "collection_items_delete_admin" on public.collection_items;
create policy "collection_items_delete_admin"
  on public.collection_items for delete
  using (public.is_admin(auth.uid()));

-- Import queue: admins can see/manage all import drafts.
drop policy if exists "perfume_imports_select_admin" on public.perfume_imports;
create policy "perfume_imports_select_admin"
  on public.perfume_imports for select
  using (public.is_admin(auth.uid()));

drop policy if exists "perfume_imports_insert_admin" on public.perfume_imports;
create policy "perfume_imports_insert_admin"
  on public.perfume_imports for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "perfume_imports_update_admin" on public.perfume_imports;
create policy "perfume_imports_update_admin"
  on public.perfume_imports for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "perfume_imports_delete_admin" on public.perfume_imports;
create policy "perfume_imports_delete_admin"
  on public.perfume_imports for delete
  using (public.is_admin(auth.uid()));
