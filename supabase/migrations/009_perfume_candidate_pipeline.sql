-- ═══════════════════════════════════════════════════════════════════════════
-- Viale — Controlled Perfume Import Pipeline
-- Discovery stores cheap candidates first. Admin approval triggers the
-- expensive enrichment/image generation step.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.perfume_discovery_jobs (
  id            uuid        not null default uuid_generate_v4(),
  created_by    uuid        references auth.users (id) on delete set null,
  status        text        not null default 'running'
    check (status in ('queued', 'running', 'complete', 'failed')),
  segment       text        not null default 'mixed'
    check (segment in ('popular', 'niche', 'designer', 'indie', 'mixed')),
  brand         text,
  target_count  integer     not null default 8 check (target_count between 1 and 50),
  found_count   integer     not null default 0 check (found_count >= 0),
  skipped_count integer     not null default 0 check (skipped_count >= 0),
  error         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint perfume_discovery_jobs_pkey primary key (id)
);

create table if not exists public.perfume_candidates (
  id               uuid        not null default uuid_generate_v4(),
  job_id           uuid        references public.perfume_discovery_jobs (id) on delete set null,
  created_by       uuid        references auth.users (id) on delete set null,
  status           text        not null default 'candidate'
    check (status in ('candidate', 'approved', 'rejected', 'enriched', 'duplicate', 'failed')),
  brand            text        not null,
  product_name     text        not null,
  product_slug     text        not null,
  segment          text        not null default 'mixed',
  reason           text        not null default '',
  source_urls      text[]      not null default '{}',
  duplicate_reason text,
  import_id        uuid        references public.perfume_imports (id) on delete set null,
  error            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint perfume_candidates_pkey primary key (id)
);

create unique index if not exists idx_perfume_candidates_product_slug
  on public.perfume_candidates (product_slug);

create index if not exists idx_perfume_candidates_status
  on public.perfume_candidates (status);

create index if not exists idx_perfume_candidates_created_by
  on public.perfume_candidates (created_by);

drop trigger if exists trg_perfume_discovery_jobs_updated_at on public.perfume_discovery_jobs;
create trigger trg_perfume_discovery_jobs_updated_at
  before update on public.perfume_discovery_jobs
  for each row execute procedure public.handle_updated_at();

drop trigger if exists trg_perfume_candidates_updated_at on public.perfume_candidates;
create trigger trg_perfume_candidates_updated_at
  before update on public.perfume_candidates
  for each row execute procedure public.handle_updated_at();

alter table public.perfume_discovery_jobs enable row level security;
alter table public.perfume_candidates enable row level security;

drop policy if exists "perfume_discovery_jobs_select_admin" on public.perfume_discovery_jobs;
create policy "perfume_discovery_jobs_select_admin"
  on public.perfume_discovery_jobs for select
  using (public.is_admin(auth.uid()));

drop policy if exists "perfume_discovery_jobs_insert_admin" on public.perfume_discovery_jobs;
create policy "perfume_discovery_jobs_insert_admin"
  on public.perfume_discovery_jobs for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "perfume_discovery_jobs_update_admin" on public.perfume_discovery_jobs;
create policy "perfume_discovery_jobs_update_admin"
  on public.perfume_discovery_jobs for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "perfume_discovery_jobs_delete_admin" on public.perfume_discovery_jobs;
create policy "perfume_discovery_jobs_delete_admin"
  on public.perfume_discovery_jobs for delete
  using (public.is_admin(auth.uid()));

drop policy if exists "perfume_candidates_select_admin" on public.perfume_candidates;
create policy "perfume_candidates_select_admin"
  on public.perfume_candidates for select
  using (public.is_admin(auth.uid()));

drop policy if exists "perfume_candidates_insert_admin" on public.perfume_candidates;
create policy "perfume_candidates_insert_admin"
  on public.perfume_candidates for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "perfume_candidates_update_admin" on public.perfume_candidates;
create policy "perfume_candidates_update_admin"
  on public.perfume_candidates for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "perfume_candidates_delete_admin" on public.perfume_candidates;
create policy "perfume_candidates_delete_admin"
  on public.perfume_candidates for delete
  using (public.is_admin(auth.uid()));

-- Admin dashboard uploads generated and synced catalog images through the
-- logged-in Supabase session, so storage.objects needs explicit admin policies.
update storage.buckets
set file_size_limit = 10485760
where id = 'product-images';

drop policy if exists "product_images_insert_admin" on storage.objects;
create policy "product_images_insert_admin" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and public.is_admin(auth.uid())
  );

drop policy if exists "product_images_update_admin" on storage.objects;
create policy "product_images_update_admin" on storage.objects
  for update using (
    bucket_id = 'product-images'
    and public.is_admin(auth.uid())
  ) with check (
    bucket_id = 'product-images'
    and public.is_admin(auth.uid())
  );

drop policy if exists "product_images_delete_admin" on storage.objects;
create policy "product_images_delete_admin" on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and public.is_admin(auth.uid())
  );
