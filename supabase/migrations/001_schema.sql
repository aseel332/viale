-- ═══════════════════════════════════════════════════════════════════════════
-- Viale — Initial Schema
-- Run this once in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Enums ────────────────────────────────────────────────────────────────────

create type fragrance_family as enum (
  'Fresh', 'Floral', 'Woody', 'Oriental', 'Gourmand', 'Chypre'
);

create type gender as enum ('Men', 'Women', 'Unisex');

create type season as enum ('Spring', 'Summer', 'Autumn', 'Winter');

create type season_category as enum ('summer', 'winter', 'celebrity');

create type order_status as enum (
  'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
);

create type cart_item_type as enum ('product', 'collection');

-- ── Profiles ─────────────────────────────────────────────────────────────────
-- Extends auth.users with public-facing profile data.
-- Automatically created when a new user signs up (see trigger below).

create table public.profiles (
  id          uuid        not null references auth.users (id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint profiles_pkey primary key (id)
);

-- ── Products ─────────────────────────────────────────────────────────────────

create table public.products (
  id          text        not null,                          -- slug: "sauvage-dior"
  name        text        not null,
  brand       text        not null,
  price       numeric(8,2) not null check (price >= 0),
  rating      numeric(3,2) not null check (rating between 0 and 5),
  image_path  text        not null default '',              -- Supabase Storage path
  tag         text,                                         -- "Bestseller", "Top Pick", …
  notes       text[]      not null default '{}',
  family      fragrance_family not null,
  gender      gender      not null,
  seasons     season[]    not null default '{}',
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint products_pkey primary key (id)
);

-- ── Collections ───────────────────────────────────────────────────────────────

create table public.collections (
  id               text        not null,                    -- slug: "summer-01"
  number           text        not null,                    -- "01", "02", …
  name             text        not null,
  subtitle         text        not null default '',
  bundle_price     numeric(8,2) not null check (bundle_price >= 0),
  season_category  season_category not null,
  is_active        boolean     not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint collections_pkey primary key (id)
);

-- ── Collection items (the 4 decants inside each box) ─────────────────────────

create table public.collection_items (
  id             uuid        not null default uuid_generate_v4(),
  collection_id  text        not null references public.collections (id) on delete cascade,
  product_id     text        not null references public.products (id) on delete cascade,
  sort_order     smallint    not null check (sort_order between 1 and 4),
  created_at     timestamptz not null default now(),

  constraint collection_items_pkey primary key (id),
  constraint collection_items_unique unique (collection_id, sort_order)
);

-- ── Orders ───────────────────────────────────────────────────────────────────

create table public.orders (
  id               uuid        not null default uuid_generate_v4(),
  user_id          uuid        not null references auth.users (id) on delete restrict,
  status           order_status not null default 'pending',
  total_amount     numeric(10,2) not null check (total_amount >= 0),
  shipping_address jsonb,                                   -- ShippingAddress shape
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint orders_pkey primary key (id)
);

-- ── Order items ───────────────────────────────────────────────────────────────

create table public.order_items (
  id             uuid        not null default uuid_generate_v4(),
  order_id       uuid        not null references public.orders (id) on delete cascade,
  product_id     text        references public.products (id) on delete set null,
  collection_id  text        references public.collections (id) on delete set null,
  quantity       smallint    not null check (quantity > 0),
  unit_price     numeric(8,2) not null check (unit_price >= 0),
  created_at     timestamptz not null default now(),

  constraint order_items_pkey primary key (id),
  -- exactly one of product_id / collection_id must be set
  constraint order_items_one_type check (
    (product_id is not null)::int + (collection_id is not null)::int = 1
  )
);

-- ── Cart items ────────────────────────────────────────────────────────────────

create table public.cart_items (
  id             uuid          not null default uuid_generate_v4(),
  user_id        uuid          not null references auth.users (id) on delete cascade,
  item_type      cart_item_type not null,
  product_id     text          references public.products (id) on delete cascade,
  collection_id  text          references public.collections (id) on delete cascade,
  quantity       smallint      not null default 1 check (quantity > 0),
  created_at     timestamptz   not null default now(),
  updated_at     timestamptz   not null default now(),

  constraint cart_items_pkey primary key (id),
  constraint cart_items_one_type check (
    (product_id is not null)::int + (collection_id is not null)::int = 1
  ),
  -- one row per (user, product) and one row per (user, collection)
  constraint cart_items_unique_product    unique (user_id, product_id),
  constraint cart_items_unique_collection unique (user_id, collection_id)
);

-- ── Wishlist ──────────────────────────────────────────────────────────────────

create table public.wishlist_items (
  id          uuid        not null default uuid_generate_v4(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  product_id  text        not null references public.products (id) on delete cascade,
  created_at  timestamptz not null default now(),

  constraint wishlist_items_pkey primary key (id),
  constraint wishlist_items_unique unique (user_id, product_id)
);

-- ── Reviews ───────────────────────────────────────────────────────────────────

create table public.reviews (
  id                    uuid        not null default uuid_generate_v4(),
  user_id               uuid        not null references auth.users (id) on delete cascade,
  product_id            text        not null references public.products (id) on delete cascade,
  rating                smallint    not null check (rating between 1 and 5),
  title                 text,
  body                  text,
  is_verified_purchase  boolean     not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint reviews_pkey primary key (id),
  constraint reviews_one_per_user_product unique (user_id, product_id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════════

create index idx_products_brand       on public.products (brand);
create index idx_products_family      on public.products (family);
create index idx_products_gender      on public.products (gender);
create index idx_products_is_active   on public.products (is_active);

create index idx_collections_category on public.collections (season_category);
create index idx_collection_items_col on public.collection_items (collection_id);

create index idx_orders_user_id       on public.orders (user_id);
create index idx_orders_status        on public.orders (status);
create index idx_order_items_order    on public.order_items (order_id);

create index idx_cart_items_user      on public.cart_items (user_id);
create index idx_wishlist_user        on public.wishlist_items (user_id);
create index idx_reviews_product      on public.reviews (product_id);
create index idx_reviews_user         on public.reviews (user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- updated_at trigger helper
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger trg_products_updated_at
  before update on public.products
  for each row execute procedure public.handle_updated_at();

create trigger trg_collections_updated_at
  before update on public.collections
  for each row execute procedure public.handle_updated_at();

create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute procedure public.handle_updated_at();

create trigger trg_cart_items_updated_at
  before update on public.cart_items
  for each row execute procedure public.handle_updated_at();

create trigger trg_reviews_updated_at
  before update on public.reviews
  for each row execute procedure public.handle_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- Auto-create profile on sign-up
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════
-- Row-Level Security (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
alter table public.profiles      enable row level security;
alter table public.products      enable row level security;
alter table public.collections   enable row level security;
alter table public.collection_items enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.cart_items    enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.reviews       enable row level security;

-- ── profiles ─────────────────────────────────────────────────────────────────
create policy "profiles_select_own"   on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own"   on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- ── products (public read) ────────────────────────────────────────────────────
create policy "products_select_active" on public.products for select using (is_active = true);

-- ── collections (public read) ─────────────────────────────────────────────────
create policy "collections_select_active" on public.collections for select using (is_active = true);

-- ── collection_items (public read) ────────────────────────────────────────────
create policy "collection_items_select" on public.collection_items for select using (true);

-- ── orders (owner only) ───────────────────────────────────────────────────────
create policy "orders_select_own"  on public.orders for select  using (auth.uid() = user_id);
create policy "orders_insert_own"  on public.orders for insert  with check (auth.uid() = user_id);
create policy "orders_update_own"  on public.orders for update  using (auth.uid() = user_id);

-- ── order_items (owner via order) ─────────────────────────────────────────────
create policy "order_items_select_own" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "order_items_insert_own" on public.order_items for insert
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- ── cart_items (owner only) ───────────────────────────────────────────────────
create policy "cart_select_own"  on public.cart_items for select  using (auth.uid() = user_id);
create policy "cart_insert_own"  on public.cart_items for insert  with check (auth.uid() = user_id);
create policy "cart_update_own"  on public.cart_items for update  using (auth.uid() = user_id);
create policy "cart_delete_own"  on public.cart_items for delete  using (auth.uid() = user_id);

-- ── wishlist_items (owner only) ───────────────────────────────────────────────
create policy "wishlist_select_own"  on public.wishlist_items for select  using (auth.uid() = user_id);
create policy "wishlist_insert_own"  on public.wishlist_items for insert  with check (auth.uid() = user_id);
create policy "wishlist_delete_own"  on public.wishlist_items for delete  using (auth.uid() = user_id);

-- ── reviews (public read, owner write) ────────────────────────────────────────
create policy "reviews_select_all"  on public.reviews for select  using (true);
create policy "reviews_insert_own"  on public.reviews for insert  with check (auth.uid() = user_id);
create policy "reviews_update_own"  on public.reviews for update  using (auth.uid() = user_id);
create policy "reviews_delete_own"  on public.reviews for delete  using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Storage buckets
-- Run in SQL Editor — or via Supabase Dashboard → Storage
-- ═══════════════════════════════════════════════════════════════════════════

-- Product / collection images (public CDN)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,                                                      -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
) on conflict (id) do nothing;

-- User avatars (private, served via signed URLs)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  2097152,                                                      -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp']
) on conflict (id) do nothing;

-- ── Storage RLS ────────────────────────────────────────────────────────────────

-- product-images: anyone can read, only service_role can write (admin uploads)
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

-- avatars: owner can read/write their own folder (folder = user_id)
create policy "avatars_owner_select" on storage.objects
  for select using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
