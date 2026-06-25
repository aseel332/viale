import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { forbiddenIfCrossOrigin } from "@/lib/server/request-guards";
import { reconcileRazorpayPayment } from "@/lib/server/payments";
import { razorpayKeyId, isRazorpayConfigured } from "@/lib/integrations/env";

type StatusBody = { orderId?: string };

export type PaymentStatusResponse = {
  orderId: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod: "razorpay" | "cod" | null;
  resumable: boolean;
  razorpay?: { orderId: string; amount: number; keyId: string };
};

/**
 * Single source of truth for the client about an order's payment state. It
 * reconciles against Razorpay (finalizing a captured-but-unconfirmed payment)
 * and returns the params needed to resume/retry an unpaid order. Used by the
 * checkout resume flow, the retry-after-failure UI, and the success page poll.
 */
export async function POST(request: NextRequest) {
  const forbidden = forbiddenIfCrossOrigin(request);
  if (forbidden) return NextResponse.json(forbidden, { status: 403 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: StatusBody;
  try {
    body = (await request.json()) as StatusBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.orderId) {
    return NextResponse.json({ error: "Missing order id." }, { status: 400 });
  }

  // Ownership check before touching the gateway.
  const { data: owned } = await supabase
    .from("orders")
    .select("id, total_amount, razorpay_order_id")
    .eq("id", body.orderId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!owned) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const reconciled = await reconcileRazorpayPayment(supabase, body.orderId);
  if (!reconciled) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const response: PaymentStatusResponse = {
    orderId: body.orderId,
    paymentStatus: reconciled.paymentStatus,
    paymentMethod: reconciled.paymentMethod,
    resumable: reconciled.resumable,
  };

  if (reconciled.resumable && reconciled.razorpayOrderId && isRazorpayConfigured()) {
    response.razorpay = {
      orderId: reconciled.razorpayOrderId,
      amount: Math.round(Number(owned.total_amount) * 100),
      keyId: razorpayKeyId(),
    };
  }

  return NextResponse.json(response);
}
