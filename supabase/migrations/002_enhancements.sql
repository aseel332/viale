-- ═══════════════════════════════════════════════════════════════════════════
-- Viale — Enhancement Migration
-- Adds: product descriptions, bottle sizes, collection descriptions,
--        size_ml on cart/order items, Google OAuth profile sync.
-- Run in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Products: add description + bottle sizes ──────────────────────────────

alter table public.products
  add column if not exists description      text not null default '',
  add column if not exists long_description text not null default '',
  add column if not exists bottle_sizes     smallint[] not null default '{5,10,30}';

-- ── Collections: add description ─────────────────────────────────────────

alter table public.collections
  add column if not exists description text not null default '';

-- ── Cart items: add size_ml (null = collection / size-agnostic item) ───────

alter table public.cart_items
  add column if not exists size_ml smallint check (size_ml in (5, 10, 30));

-- Drop old single-product uniqueness constraint and replace with one that
-- scopes uniqueness to (user, product, size) so different sizes are distinct rows.
alter table public.cart_items
  drop constraint if exists cart_items_unique_product;

alter table public.cart_items
  add constraint cart_items_unique_product_size
    unique (user_id, product_id, size_ml);

-- ── Order items: add size_ml ───────────────────────────────────────────────

alter table public.order_items
  add column if not exists size_ml smallint check (size_ml in (5, 10, 30));

-- ── RLS Policies ──────────────────────────────────────────────────────────
-- Enable RLS on every table that touches user data.

alter table public.profiles      enable row level security;
alter table public.cart_items    enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.reviews        enable row level security;

-- Products & collections are public-readable, write-restricted.
alter table public.products       enable row level security;
alter table public.collections    enable row level security;
alter table public.collection_items enable row level security;

-- ── Products / Collections (public read) ──────────────────────────────────

drop policy if exists "products_select" on public.products;
create policy "products_select"
  on public.products for select
  using (is_active = true);

drop policy if exists "collections_select" on public.collections;
create policy "collections_select"
  on public.collections for select
  using (is_active = true);

drop policy if exists "collection_items_select" on public.collection_items;
create policy "collection_items_select"
  on public.collection_items for select
  using (true);

-- ── Profiles ──────────────────────────────────────────────────────────────

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ── Cart items ────────────────────────────────────────────────────────────

drop policy if exists "cart_select_own" on public.cart_items;
create policy "cart_select_own"
  on public.cart_items for select
  using (auth.uid() = user_id);

drop policy if exists "cart_insert_own" on public.cart_items;
create policy "cart_insert_own"
  on public.cart_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "cart_update_own" on public.cart_items;
create policy "cart_update_own"
  on public.cart_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "cart_delete_own" on public.cart_items;
create policy "cart_delete_own"
  on public.cart_items for delete
  using (auth.uid() = user_id);

-- ── Orders ────────────────────────────────────────────────────────────────

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- ── Order items ───────────────────────────────────────────────────────────

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

-- ── Wishlist ──────────────────────────────────────────────────────────────

drop policy if exists "wishlist_select_own" on public.wishlist_items;
create policy "wishlist_select_own"
  on public.wishlist_items for select
  using (auth.uid() = user_id);

drop policy if exists "wishlist_insert_own" on public.wishlist_items;
create policy "wishlist_insert_own"
  on public.wishlist_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "wishlist_delete_own" on public.wishlist_items;
create policy "wishlist_delete_own"
  on public.wishlist_items for delete
  using (auth.uid() = user_id);

-- ── Reviews ───────────────────────────────────────────────────────────────

drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all"
  on public.reviews for select
  using (true);

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own"
  on public.reviews for insert
  with check (auth.uid() = user_id);

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own"
  on public.reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- ── Profile auto-create trigger ───────────────────────────────────────────
-- Fires when a new auth.users row is inserted (email or OAuth signup).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set full_name  = coalesce(excluded.full_name,  profiles.full_name),
        avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
