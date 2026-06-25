import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { reconcileRazorpayPayment } from "@/lib/server/payments";
import { formatPrice } from "@/lib/product-utils";
import { DELIVERY_ESTIMATE } from "@/lib/shipping";
import PaymentVerifying from "./PaymentVerifying";

export const metadata = { title: "Order Confirmed — Viale" };

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  if (!orderId) redirect("/");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account");

  const { data: order } = await supabase
    .from("orders")
    .select("id, total_amount, created_at, status, payment_method, payment_status, contact_phone, shipping_address")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!order) redirect("/");

  // An online order is only "confirmed" once payment is captured. Reconcile
  // against Razorpay first (covers a buyer who refreshed/closed the tab right
  // after paying), then hand any still-unpaid order to the client watcher
  // instead of falsely showing a confirmation.
  if (order.payment_method === "razorpay" && order.payment_status !== "paid") {
    const reconciled = await reconcileRazorpayPayment(supabase, order.id);
    if (reconciled?.paymentStatus !== "paid") {
      return <PaymentVerifying orderId={order.id} />;
    }
    order.payment_status = "paid";
    order.status = "processing";
  }

  const shippingAddress = order.shipping_address as { full_name?: string } | null;
  const recipientName = shippingAddress?.full_name ?? "";
  const contactPhone = order.contact_phone ?? "";
  const isCod = order.payment_method === "cod";
  const paidLine = isCod
    ? "Pay in cash when your order arrives."
    : order.payment_status === "paid"
      ? "Your payment was received."
      : "We're confirming your payment.";

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-28 pb-20 flex items-start justify-center">
      <div className="max-w-md w-full px-5 text-center">
        <div className="w-14 h-14 rounded-full bg-[#EAF4EA] flex items-center justify-center mx-auto mb-6">
          <Check size={26} className="text-[#3A7A3A]" />
        </div>
        <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A86C] mb-2">Thank You</p>
        <h1 className="text-4xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111] mb-4">
          Order Confirmed
        </h1>
        <p className="text-[14px] text-[#4A4A4A] leading-relaxed mb-2">
          We&apos;ve received your order. {paidLine} A confirmation has been sent to your email.
        </p>
        <p className="inline-flex items-center gap-2 text-[12px] text-[#6B6B6B] mb-8">
          <Clock size={14} /> Delivery in {DELIVERY_ESTIMATE}
        </p>

        <div className="bg-white border border-[#E8E4DE] p-6 text-left space-y-3 mb-8">
          <div className="flex justify-between text-[13px]">
            <span className="text-[#6B6B6B]">Order number</span>
            <span className="text-[#111] font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>
          </div>
          {recipientName && (
            <div className="flex justify-between text-[13px]">
              <span className="text-[#6B6B6B]">Name</span>
              <span className="text-[#111] font-medium">{recipientName}</span>
            </div>
          )}
          {contactPhone && (
            <div className="flex justify-between text-[13px]">
              <span className="text-[#6B6B6B]">Phone</span>
              <span className="text-[#111] font-medium">{contactPhone}</span>
            </div>
          )}
          <div className="flex justify-between text-[13px]">
            <span className="text-[#6B6B6B]">Total</span>
            <span className="text-[#111] font-medium tabular-nums">{formatPrice(Number(order.total_amount))}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-[#6B6B6B]">Payment</span>
            <span className="text-[#111] font-medium">{isCod ? "Cash on Delivery" : "Paid online"}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-[#6B6B6B]">Status</span>
            <span className="text-[#111] font-medium capitalize">{order.status}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/account/orders/${order.id}`}
            className="flex-1 bg-[#111] text-white text-[11px] tracking-[0.2em] uppercase py-3.5 hover:bg-[#333] transition-colors"
          >
            Track Order
          </Link>
          <Link
            href="/"
            className="flex-1 border border-[#111] text-[#111] text-[11px] tracking-[0.2em] uppercase py-3.5 hover:bg-[#111] hover:text-white transition-colors"
          >
            Keep Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
