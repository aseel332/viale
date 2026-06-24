-- ═══════════════════════════════════════════════════════════════════════════
-- Viale — Collection Media & Manual Collections
-- Gives collections their own imagery and supports manually-built collections
-- that aren't backed by 4 catalogue products.
-- Run this after the previous migrations.
--
--   image_paths  : up to 4 Supabase Storage URLs for the collection's display
--                  imagery. Empty ('{}') for "from products" collections, which
--                  reuse their member products' photos on the storefront.
--   manual_items : the 4 scent labels for a manual collection, e.g.
--                    [{"name": "Sauvage", "brand": "Dior"}, …]
--                  Null for "from products" collections, whose scent info comes
--                  from the linked products via collection_items.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.collections
  add column if not exists image_paths text[] not null default '{}',
  add column if not exists manual_items jsonb;

comment on column public.collections.image_paths is
  'Up to 4 collection display images. Empty for product-backed collections (which reuse product photos).';
comment on column public.collections.manual_items is
  'Manual scent labels [{name, brand}] for collections not backed by catalogue products. Null otherwise.';
