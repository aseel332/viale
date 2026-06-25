"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Clock } from "lucide-react";
import { getPaymentStatus } from "@/lib/client/commerce-api";

const POLL_INTERVAL_MS = 2500;
const MAX_ATTEMPTS = 8; // ~20s of polling before we stop and reassure.

/**
 * Shown when a Razorpay order reaches the success page but isn't confirmed paid
 * yet — e.g. the buyer refreshed or closed the tab right after paying. We poll
 * the reconciling status endpoint (which checks Razorpay directly) until the
 * payment settles. This is the safety net that means a real payment is never
 * lost to a flaky client.
 */
export default function PaymentVerifying({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"checking" | "failed" | "stalled">("checking");
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    let attempts = 0;

    async function poll() {
      if (cancelled.current) return;
      attempts += 1;
      const res = await getPaymentStatus(orderId);

      if (cancelled.current) return;

      if (res.data?.paymentStatus === "paid") {
        // Server now sees it as paid — re-render the confirmed view.
        router.refresh();
        return;
      }
      if (res.data?.paymentStatus === "failed") {
        setPhase("failed");
        return;
      }
      if (attempts >= MAX_ATTEMPTS) {
        setPhase("stalled");
        return;
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    }

    void poll();
    return () => {
      cancelled.current = true;
    };
  }, [orderId, router]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-28 pb-20 flex items-start justify-center">
      <div className="max-w-md w-full px-5 text-center">
        {phase === "checking" && (
          <>
            <div className="w-14 h-14 rounded-full bg-[#F5F1EB] flex items-center justify-center mx-auto mb-6">
              <Loader2 size={26} className="text-[#C9A86C] animate-spin" />
            </div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A86C] mb-2">One Moment</p>
            <h1 className="text-4xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111] mb-4">
              Confirming Payment
            </h1>
            <p className="text-[14px] text-[#4A4A4A] leading-relaxed">
              We&apos;re confirming your payment with the bank. This usually takes a few seconds —
              please don&apos;t close this window.
            </p>
          </>
        )}

        {phase === "stalled" && (
          <>
            <div className="w-14 h-14 rounded-full bg-[#F5F1EB] flex items-center justify-center mx-auto mb-6">
              <Clock size={26} className="text-[#C9A86C]" />
            </div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A86C] mb-2">Almost There</p>
            <h1 className="text-4xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111] mb-4">
              Payment Processing
            </h1>
            <p className="text-[14px] text-[#4A4A4A] leading-relaxed mb-8">
              Your payment is still being confirmed. If money was debited, your order will appear in
              your account shortly and we&apos;ll email you — no need to pay again. You can safely
              check back in a few minutes.
            </p>
            <div className="flex gap-3">
              <Link
                href="/account?tab=orders"
                className="flex-1 bg-[#111] text-white text-[11px] tracking-[0.2em] uppercase py-3.5 hover:bg-[#333] transition-colors"
              >
                View My Orders
              </Link>
              <Link
                href="/"
                className="flex-1 border border-[#111] text-[#111] text-[11px] tracking-[0.2em] uppercase py-3.5 hover:bg-[#111] hover:text-white transition-colors"
              >
                Keep Shopping
              </Link>
            </div>
          </>
        )}

        {phase === "failed" && (
          <>
            <div className="w-14 h-14 rounded-full bg-[#FBEAEA] flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={26} className="text-[#B23A3A]" />
            </div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#B23A3A] mb-2">Payment Failed</p>
            <h1 className="text-4xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111] mb-4">
              Payment Didn&apos;t Go Through
            </h1>
            <p className="text-[14px] text-[#4A4A4A] leading-relaxed mb-8">
              Your payment couldn&apos;t be completed and you have not been charged. You can try
              checking out again — your bag is still saved.
            </p>
            <div className="flex gap-3">
              <Link
                href="/checkout"
                className="flex-1 bg-[#111] text-white text-[11px] tracking-[0.2em] uppercase py-3.5 hover:bg-[#333] transition-colors"
              >
                Try Again
              </Link>
              <Link
                href="/cart"
                className="flex-1 border border-[#111] text-[#111] text-[11px] tracking-[0.2em] uppercase py-3.5 hover:bg-[#111] hover:text-white transition-colors"
              >
                Back to Bag
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
