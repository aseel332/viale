import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { recordOrderEvent } from "@/lib/server/order-events";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

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
