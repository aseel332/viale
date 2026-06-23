-- ═══════════════════════════════════════════════════════════════════════════
-- Viale — Simplify Address Details
-- Address line 2 now carries apartment/house name and floor details.
-- ═══════════════════════════════════════════════════════════════════════════

update public.addresses
set line2 = concat_ws(
  ', ',
  nullif(line2, ''),
  nullif(apartment_name, ''),
  nullif(floor, '')
)
where (apartment_name is not null and apartment_name <> '')
   or (floor is not null and floor <> '');

alter table public.addresses
  drop column if exists apartment_name,
  drop column if exists floor;
