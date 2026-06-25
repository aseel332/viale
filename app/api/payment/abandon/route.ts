import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { forbiddenIfCrossOrigin } from "@/lib/server/request-guards";
import { abandonRazorpayOrder } from "@/lib/server/payments";

type AbandonBody = { orderId?: string };

/**
 * Delete an unpaid online order the buyer has given up on (closed the payment
 * window / chose another method), so it never lingers as a failed order. Safe
 * by construction: the server reconciles against Razorpay and refuses to delete
 * anything that was actually paid.
 */
export async function POST(request: NextRequest) {
  const forbidden = forbiddenIfCrossOrigin(request);
  if (forbidden) return NextResponse.json(forbidden, { status: 403 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: AbandonBody;
  try {
    body = (await request.json()) as AbandonBody;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.orderId) return NextResponse.json({ error: "Missing order id." }, { status: 400 });

  // Ownership check — a user may only abandon their own order.
  const { data: owned } = await supabase
    .from("orders")
    .select("id")
    .eq("id", body.orderId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!owned) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const result = await abandonRazorpayOrder(supabase, body.orderId);
  // If reconciliation found the order was actually paid, tell the client so it
  // can route to confirmation instead of silently dropping a real payment.
  return NextResponse.json({ deleted: result.deleted, paid: result.paid });
}
