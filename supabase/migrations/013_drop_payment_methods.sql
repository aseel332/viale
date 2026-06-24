-- ═══════════════════════════════════════════════════════════════════════════
-- Viale — Remove merchant-side card storage
-- Drops the payment_methods table. Saved cards are handled entirely by Razorpay
-- (TokenHQ) inside the hosted Checkout window; per RBI (1 Jul 2022) merchants may
-- not store card details. The account "Payment" section now shows payment history
-- derived from orders instead.
--
-- Dropping the table also removes its RLS policies and the user index.
-- Run this after the previous migrations.
-- ═══════════════════════════════════════════════════════════════════════════

drop table if exists public.payment_methods cascade;
