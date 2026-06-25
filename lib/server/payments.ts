import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { recordOrderEvent } from "@/lib/server/order-events";
import { fetchOrderPayments, findCapturedPayment } from "@/lib/payments/razorpay";
import type { Database, PaymentMethod, PaymentStatus } from "@/types/database";

type Client = SupabaseClient<Database>;

export type ReconcileResult = {
  /** The order's payment state after reconciliation. */
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  /** Whether this order can still be paid (unpaid Razorpay order with a gateway order id). */
  resumable: boolean;
  razorpayOrderId: string | null;
};

/**
 * Mark a Razorpay order as paid and ready to fulfill. Idempotent: safe to call
 * from both the client-side verify endpoint and the webhook for the same order.
 */
export async function finalizeRazorpayPayment(
  supabase: Client,
  params: { orderId: string; paymentId: string },
): Promise<{ ok: boolean; alreadyPaid?: boolean }> {
  const { data: order } = await supabase
    .from("orders")
    .select("id, user_id, payment_status")
    .eq("id", params.orderId)
    .maybeSingle();

  if (!order) return { ok: false };
  if (order.payment_status === "paid") return { ok: true, alreadyPaid: true };

  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      status: "processing",
      razorpay_payment_id: params.paymentId,
    })
    .eq("id", params.orderId);

  if (error) return { ok: false };

  // Payment done → clear the buyer's cart and log the event.
  await supabase.from("cart_items").delete().eq("user_id", order.user_id);
  await recordOrderEvent({
    order_id: params.orderId,
    type: "payment",
    title: "Payment received",
    description: "Your online payment was successful and your order is being prepared.",
    status: "processing",
  });

  return { ok: true };
}

export async function markPaymentFailed(supabase: Client, orderId: string): Promise<void> {
  const { data: order } = await supabase
    .from("orders")
    .select("id, payment_status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.payment_status === "paid" || order.payment_status === "refunded") return;

  await supabase.from("orders").update({ payment_status: "failed" }).eq("id", orderId);
  await recordOrderEvent({
    order_id: orderId,
    type: "payment",
    title: "Payment failed",
    description: "We couldn't confirm your online payment. You can retry from your order.",
    is_customer_visible: false,
  });
}

/**
 * Determine an order's true payment state, asking Razorpay directly when the
 * order is still unpaid. This is what makes the flow resilient to refreshes and
 * closed tabs: even if the client-side handler never ran and the webhook is
 * delayed or missing, a captured payment is detected here and finalized.
 *
 * Only ever upgrades an order to "paid" — it never marks an order failed, since
 * a transient failed attempt may be followed by a successful retry on the same
 * Razorpay order. Failures are recorded by the webhook (`payment.failed`).
 */
export async function reconcileRazorpayPayment(
  supabase: Client,
  orderId: string,
): Promise<ReconcileResult | null> {
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, payment_method, payment_status, razorpay_order_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return null;

  const isRazorpay = order.payment_method === "razorpay";
  const settled = order.payment_status === "paid" || order.payment_status === "refunded";

  // Unpaid Razorpay order with a gateway order — ask Razorpay whether it was
  // actually paid (the client may have died before confirming).
  if (isRazorpay && !settled && order.razorpay_order_id) {
    try {
      const payments = await fetchOrderPayments(order.razorpay_order_id);
      const captured = findCapturedPayment(payments);
      if (captured) {
        const result = await finalizeRazorpayPayment(supabase, {
          orderId: order.id,
          paymentId: captured.id,
        });
        if (result.ok) {
          return {
            paymentStatus: "paid",
            paymentMethod: order.payment_method,
            resumable: false,
            razorpayOrderId: order.razorpay_order_id,
          };
        }
      }
    } catch (err) {
      // Network/gateway hiccup — fall through and report the stored state. The
      // webhook remains the backstop; the caller can retry.
      console.error("reconcileRazorpayPayment lookup failed:", err);
    }
  }

  const resumable =
    isRazorpay &&
    !settled &&
    order.status !== "cancelled" &&
    Boolean(order.razorpay_order_id);

  return {
    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,
    resumable,
    razorpayOrderId: order.razorpay_order_id,
  };
}

/**
 * Permanently delete an unpaid online order the buyer has walked away from, so
 * abandoned/failed payments leave no trace (they never become real orders).
 *
 * Reconciles against Razorpay FIRST and refuses to delete anything that turned
 * out to be paid — essential with live keys, where a deleted-but-paid order
 * would mean money taken with no record. Returns the outcome so the caller can
 * route a surprise-paid order to confirmation instead.
 */
export async function abandonRazorpayOrder(
  supabase: Client,
  orderId: string,
): Promise<{ deleted: boolean; paid: boolean }> {
  const reconciled = await reconcileRazorpayPayment(supabase, orderId);
  if (!reconciled) return { deleted: false, paid: false };

  // Only ever delete an unpaid online order. Never touch COD, paid, or refunded.
  if (
    reconciled.paymentMethod !== "razorpay" ||
    reconciled.paymentStatus === "paid" ||
    reconciled.paymentStatus === "refunded"
  ) {
    return { deleted: false, paid: reconciled.paymentStatus === "paid" };
  }

  // order_events cascade on order delete; remove items explicitly first.
  await supabase.from("order_items").delete().eq("order_id", orderId);
  const { error } = await supabase.from("orders").delete().eq("id", orderId);
  if (error) {
    console.error("abandonRazorpayOrder delete failed:", error.message);
    return { deleted: false, paid: false };
  }
  return { deleted: true, paid: false };
}

export async function markPaymentRefunded(supabase: Client, orderId: string): Promise<void> {
  const { data: order } = await supabase
    .from("orders")
    .select("id, payment_status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.payment_status === "refunded") return;

  await supabase
    .from("orders")
    .update({ payment_status: "refunded", status: "refunded" })
    .eq("id", orderId);
  await recordOrderEvent({
    order_id: orderId,
    type: "payment",
    title: "Refund processed",
    description: "Your refund has been processed and should reflect in 5–7 business days.",
    status: "refunded",
  });
}
