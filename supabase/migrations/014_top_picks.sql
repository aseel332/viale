-- ═══════════════════════════════════════════════════════════════════════════
-- Viale — Home "Top Picks" curation
-- Lets the admin choose which existing products appear in the "Most Loved"
-- (Top Picks) carousel on the home page, instead of the hard-coded seed list.
--
-- is_top_pick     — when true, the product is featured in the home Top Picks row.
-- top_pick_order  — display order within that row (ascending; ties break by
--                   created_at). Defaults to 0 so newly flagged items group at
--                   the front until an explicit order is set.
--
-- Existing rows default to not-featured, so the storefront keeps working
-- untouched until the admin curates the list.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.products
  add column if not exists is_top_pick    boolean not null default false,
  add column if not exists top_pick_order integer not null default 0;

comment on column public.products.is_top_pick is
  'When true, the product is featured in the home page Top Picks ("Most Loved") carousel.';
comment on column public.products.top_pick_order is
  'Display order within the home Top Picks row (ascending; ties break by created_at).';

-- Fast lookup of the curated set, ordered for display.
create index if not exists products_top_pick_idx
  on public.products (top_pick_order, created_at)
  where is_top_pick;
