-- ═══════════════════════════════════════════════════════════════════════════
-- Viale — Perfume Import Agent Drafts
-- Stores AI/web-generated perfume candidates before an admin prices and
-- publishes them into the live catalogue.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.perfume_imports (
  id             uuid        not null default uuid_generate_v4(),
  created_by     uuid        references auth.users (id) on delete set null,
  status         text        not null default 'draft'
    check (status in ('draft', 'ready', 'failed', 'published', 'rejected')),
  query          text        not null default '',
  brand          text        not null default '',
  product_name   text        not null default '',
  product_slug   text        not null default '',
  candidate      jsonb       not null default '{}'::jsonb,
  sources        jsonb       not null default '[]'::jsonb,
  image_path     text,
  image_prompt   text,
  error          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint perfume_imports_pkey primary key (id)
);

create index if not exists idx_perfume_imports_created_by on public.perfume_imports (created_by);
create index if not exists idx_perfume_imports_status on public.perfume_imports (status);
create index if not exists idx_perfume_imports_slug on public.perfume_imports (product_slug);

drop trigger if exists trg_perfume_imports_updated_at on public.perfume_imports;
create trigger trg_perfume_imports_updated_at
  before update on public.perfume_imports
  for each row execute procedure public.handle_updated_at();

alter table public.perfume_imports enable row level security;

drop policy if exists "perfume_imports_select_own" on public.perfume_imports;
create policy "perfume_imports_select_own"
  on public.perfume_imports for select
  using (auth.uid() = created_by);

drop policy if exists "perfume_imports_insert_own" on public.perfume_imports;
create policy "perfume_imports_insert_own"
  on public.perfume_imports for insert
  with check (auth.uid() = created_by);

drop policy if exists "perfume_imports_update_own" on public.perfume_imports;
create policy "perfume_imports_update_own"
  on public.perfume_imports for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

drop policy if exists "perfume_imports_delete_own" on public.perfume_imports;
create policy "perfume_imports_delete_own"
  on public.perfume_imports for delete
  using (auth.uid() = created_by);
