import { type NextRequest } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { isRazorpayConfigured } from "@/lib/integrations/env";
import { createServiceClient } from "@/lib/supabase/service";
import {
  finalizeRazorpayPayment,
  markPaymentFailed,
  markPaymentRefunded,
} from "@/lib/server/payments";

// Source of truth for payment state. Runs without a user session, so it uses
// the service-role client and is idempotent (Razorpay may retry deliveries).
export async function POST(request: NextRequest) {
  if (!isRazorpayConfigured()) {
    return new Response("Razorpay not configured", { status: 503 });
  }

  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const rawBody = await request.text();

  if (!verifyWebhookSignature(rawBody, signature)) {
    return new Response("Invalid signature", { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string } };
    };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  const razorpayOrderId = payment?.order_id;
  const paymentId = payment?.id;

  if (!razorpayOrderId) {
    // Nothing actionable (e.g. an event without a payment entity).
    return new Response("ok", { status: 200 });
  }

  const supabase = createServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();

  if (!order) return new Response("ok", { status: 200 });

  try {
    switch (event.event) {
      case "payment.captured":
      case "order.paid":
        if (paymentId) await finalizeRazorpayPayment(supabase, { orderId: order.id, paymentId });
        break;
      case "payment.failed":
        await markPaymentFailed(supabase, order.id);
        break;
      case "refund.processed":
      case "refund.created":
        await markPaymentRefunded(supabase, order.id);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error("Razorpay webhook handling failed:", err);
    return new Response("error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
