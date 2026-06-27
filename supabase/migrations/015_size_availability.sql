-- ═══════════════════════════════════════════════════════════════════════════
-- Viale — Per-Size Availability
-- Adds an optional per-bottle-size availability override to products so a single
-- size (e.g. 30ml) can be taken offline without hiding the whole product.
-- Run this after the previous migrations.
--
-- Shape of size_availability (all keys optional, value is a boolean):
--   { "5": true, "10": true, "30": false }
--
-- When a size has no entry (or size_availability is null), the storefront
-- default applies:
--   • 5ml and 10ml are available
--   • 30ml is UNAVAILABLE until an admin explicitly enables it here
--
-- This means existing rows need no backfill: every 30ml option is off until
-- toggled on per product from the admin dashboard.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.products
  add column if not exists size_availability jsonb;

comment on column public.products.size_availability is
  'Optional per-size availability overrides keyed by ml ("5"|"10"|"30") → boolean. When a size is absent, the storefront default applies: 5ml & 10ml available, 30ml unavailable until explicitly enabled here.';
