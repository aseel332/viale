-- ─────────────────────────────────────────────────────────────────────────────
-- 011_checkout_fulfillment.sql
-- Industry-ready checkout: payments (Razorpay + COD), Shiprocket fulfillment,
-- an order event timeline (visible to customers, managed by admins), and the
-- admin RLS needed to manage every order.
--
-- Run by hand in the Supabase SQL editor (project convention — see memory note).
--
-- Order status convention:
--   * orders.status      = fulfillment lifecycle the admin controls
--                          (pending → processing → shipped → delivered;
--                           cancelled / refunded as needed)
--   * orders.payment_status = money state ('pending' | 'paid' | 'failed' | 'refunded')
--
--   Razorpay (unpaid)   → status='pending',    payment_status='pending'
--   Payment captured    → status='processing', payment_status='paid'
--   COD placed          → status='processing', payment_status='pending'
--                         (admin sets payment_status='paid' on delivery)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── orders: payment + shipping breakdown + courier fields ────────────────────
alter table public.orders
  add column if not exists payment_method       text,
  add column if not exists payment_status       text not null default 'pending',
  add column if not exists subtotal             numeric(10,2),
  add column if not exists shipping_charge      numeric(10,2),
  add column if not exists shipping_quote       jsonb,
  add column if not exists razorpay_order_id    text,
  add column if not exists razorpay_payment_id  text,
  add column if not exists shiprocket_order_id  text,
  add column if not exists shiprocket_shipment_id text,
  add column if not exists awb_code             text,
  add column if not exists courier_name         text,
  add column if not exists tracking_url         text,
  add column if not exists label_url            text,
  add column if not exists contact_email        text,
  add column if not exists contact_phone        text;

do $$ begin
  alter table public.orders
    add constraint orders_payment_method_check
    check (payment_method is null or payment_method in ('razorpay', 'cod'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.orders
    add constraint orders_payment_status_check
    check (payment_status in ('pending', 'paid', 'failed', 'refunded'));
exception when duplicate_object then null; end $$;

create index if not exists idx_orders_payment_status on public.orders (payment_status);
create index if not exists idx_orders_razorpay_order on public.orders (razorpay_order_id);

-- ── products: per-unit shipping weight (grams) ───────────────────────────────
alter table public.products
  add column if not exists weight_g int not null default 60;

-- ── order_events: customer-visible timeline + admin audit log ────────────────
create table if not exists public.order_events (
  id                  uuid        not null default uuid_generate_v4(),
  order_id            uuid        not null references public.orders (id) on delete cascade,
  type                text        not null default 'note'
                        check (type in ('status_change', 'shipment', 'note', 'payment')),
  title               text        not null,
  description         text,
  status              order_status,
  is_customer_visible boolean     not null default true,
  created_by          uuid        references auth.users (id) on delete set null,
  created_at          timestamptz not null default now(),

  constraint order_events_pkey primary key (id)
);

create index if not exists idx_order_events_order on public.order_events (order_id, created_at);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.order_events enable row level security;

-- Customers see their own customer-visible events; admins see everything.
drop policy if exists "order_events_select" on public.order_events;
create policy "order_events_select"
  on public.order_events for select
  using (
    public.is_admin(auth.uid())
    or (
      is_customer_visible
      and exists (
        select 1 from public.orders o
        where o.id = order_events.order_id and o.user_id = auth.uid()
      )
    )
  );

-- Only admins write events through the authenticated client. System writes
-- (order placed, payment captured/failed, refunds) go through the service-role
-- client, which bypasses RLS.
drop policy if exists "order_events_admin_insert" on public.order_events;
create policy "order_events_admin_insert"
  on public.order_events for insert
  with check (public.is_admin(auth.uid()));

-- ── Admin access to orders / order_items ─────────────────────────────────────
-- Existing policies (migrations 001/002) are owner-only. Admins manage all
-- orders, so add admin-wide select/update policies via the is_admin() helper.
drop policy if exists "orders_admin_select" on public.orders;
create policy "orders_admin_select"
  on public.orders for select
  using (public.is_admin(auth.uid()));

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update"
  on public.orders for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "order_items_admin_select" on public.order_items;
create policy "order_items_admin_select"
  on public.order_items for select
  using (public.is_admin(auth.uid()));
