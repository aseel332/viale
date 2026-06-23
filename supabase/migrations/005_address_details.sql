-- ═══════════════════════════════════════════════════════════════════════════
-- Viale — Address Details Migration
-- Adds structured India shipping address fields used by the address book.
-- Run in: Supabase Dashboard → SQL Editor (idempotent — safe to re-run).
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.addresses
  add column if not exists landmark      text,
  add column if not exists apartment_name text,
  add column if not exists floor         text;

update public.addresses
set country = 'IN'
where country is null or upper(country) <> 'IN';

alter table public.addresses
  alter column country set default 'IN';
