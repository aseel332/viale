-- ═══════════════════════════════════════════════════════════════════════════
-- Viale — Address Book Migration
-- Adds a first-class addresses table, migrates any legacy profile address,
-- and removes profiles.address.
-- Run in: Supabase Dashboard → SQL Editor (idempotent — safe to re-run).
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.addresses (
  id           uuid        not null default uuid_generate_v4(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  label        text        not null default 'Home',
  full_name    text        not null,
  phone        text,
  line1        text        not null,
  line2        text,
  city         text        not null,
  state        text        not null default '',
  postal_code  text        not null,
  country      text        not null default 'IN',
  is_default   boolean     not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint addresses_pkey primary key (id),
  constraint addresses_country_len check (char_length(country) = 2)
);

create index if not exists idx_addresses_user on public.addresses (user_id);
create unique index if not exists idx_addresses_one_default
  on public.addresses (user_id)
  where is_default;

drop trigger if exists trg_addresses_updated_at on public.addresses;
create trigger trg_addresses_updated_at
  before update on public.addresses
  for each row execute procedure public.handle_updated_at();

-- Migrate the legacy single profile address when present.
insert into public.addresses (
  user_id, label, full_name, phone, line1, line2, city, state, postal_code, country, is_default
)
select
  p.id,
  'Home',
  coalesce(nullif(p.address->>'full_name', ''), nullif(p.full_name, ''), 'Recipient'),
  p.phone,
  coalesce(nullif(p.address->>'line1', ''), 'Address line 1'),
  nullif(p.address->>'line2', ''),
  coalesce(nullif(p.address->>'city', ''), 'City'),
  coalesce(nullif(p.address->>'state', ''), ''),
  coalesce(nullif(p.address->>'postal_code', ''), '000000'),
  coalesce(nullif(upper(p.address->>'country'), ''), 'IN'),
  true
from public.profiles p
where p.address is not null
  and not exists (
    select 1 from public.addresses a
    where a.user_id = p.id
  );

alter table public.profiles
  drop column if exists address;

alter table public.addresses enable row level security;

drop policy if exists "addresses_select_own" on public.addresses;
create policy "addresses_select_own"
  on public.addresses for select
  using (auth.uid() = user_id);

drop policy if exists "addresses_insert_own" on public.addresses;
create policy "addresses_insert_own"
  on public.addresses for insert
  with check (auth.uid() = user_id);

drop policy if exists "addresses_update_own" on public.addresses;
create policy "addresses_update_own"
  on public.addresses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "addresses_delete_own" on public.addresses;
create policy "addresses_delete_own"
  on public.addresses for delete
  using (auth.uid() = user_id);
