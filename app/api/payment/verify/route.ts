import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { forbiddenIfCrossOrigin } from "@/lib/server/request-guards";
import { verifyPaymentSignature } from "@/lib/payments/razorpay";
import { finalizeRazorpayPayment } from "@/lib/server/payments";

type VerifyBody = {
  orderId?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

export async function POST(request: NextRequest) {
  const forbidden = forbiddenIfCrossOrigin(request);
  if (forbidden) return NextResponse.json(forbidden, { status: 403 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: VerifyBody;
  try {
    body = (await request.json()) as VerifyBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }

  // The order must belong to this user and match the Razorpay order it claims.
  const { data: order } = await supabase
    .from("orders")
    .select("id, razorpay_order_id")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!order || order.razorpay_order_id !== razorpay_order_id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const result = await finalizeRazorpayPayment(supabase, {
    orderId,
    paymentId: razorpay_payment_id,
  });
  if (!result.ok) {
    return NextResponse.json({ error: "Could not finalize the order." }, { status: 500 });
  }

  return NextResponse.json({ orderId, status: "paid" });
}
