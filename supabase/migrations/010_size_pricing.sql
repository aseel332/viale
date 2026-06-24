-- ═══════════════════════════════════════════════════════════════════════════
-- Viale — Per-Size Pricing
-- Adds an optional per-bottle-size price/discount override to products.
-- Run this after the previous migrations.
--
-- Shape of size_pricing (all keys optional):
--   {
--     "5":  { "price": 1200, "discount": 999  },
--     "10": { "price": 2100, "discount": null },
--     "30": { "price": 4800, "discount": null }
--   }
--
-- When a size has no entry (or size_pricing is null), the storefront falls back
-- to the legacy multiplier model derived from products.price / discount_price,
-- so existing rows keep working untouched.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.products
  add column if not exists size_pricing jsonb;

comment on column public.products.size_pricing is
  'Optional per-size price/discount overrides keyed by ml ("5"|"10"|"30"). Null falls back to the multiplier model on products.price.';
