import "server-only";

import crypto from "node:crypto";
import {
  isRazorpayConfigured,
  razorpayKeyId,
  razorpayKeySecret,
  razorpayWebhookSecret,
} from "@/lib/integrations/env";

const BASE = "https://api.razorpay.com/v1";

export { isRazorpayConfigured };

function authHeader(): string {
  const creds = Buffer.from(`${razorpayKeyId()}:${razorpayKeySecret()}`).toString("base64");
  return `Basic ${creds}`;
}

export type RazorpayOrder = { id: string; amount: number; currency: string };

/** Create a Razorpay order. `amountPaise` is the total in the smallest unit. */
export async function createRazorpayOrder(
  amountPaise: number,
  receipt: string,
  notes?: Record<string, string>,
): Promise<RazorpayOrder> {
  const res = await fetch(`${BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader() },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: receipt.slice(0, 40),
      payment_capture: 1,
      notes,
    }),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as RazorpayOrder & {
    error?: { description?: string };
  };
  if (!res.ok || !data.id) {
    throw new Error(`Razorpay order creation failed: ${data.error?.description ?? res.statusText}`);
  }
  return data;
}

export type RazorpayPaymentStatus =
  | "created"
  | "authorized"
  | "captured"
  | "refunded"
  | "failed";

export type RazorpayPayment = {
  id: string;
  status: RazorpayPaymentStatus;
  order_id: string;
  amount: number;
};

/**
 * Fetch every payment attempt Razorpay has recorded against an order. This is
 * the source of truth used to reconcile an order whose client-side handler may
 * never have run (tab closed, refresh, lost network) — we ask the gateway
 * directly instead of trusting the browser or waiting on a webhook.
 */
export async function fetchOrderPayments(razorpayOrderId: string): Promise<RazorpayPayment[]> {
  const res = await fetch(`${BASE}/orders/${razorpayOrderId}/payments`, {
    method: "GET",
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: { description?: string } };
    throw new Error(`Razorpay payment lookup failed: ${data.error?.description ?? res.statusText}`);
  }
  const data = (await res.json().catch(() => ({}))) as { items?: RazorpayPayment[] };
  return data.items ?? [];
}

/** The successfully captured payment for an order, if one exists. */
export function findCapturedPayment(payments: RazorpayPayment[]): RazorpayPayment | undefined {
  return payments.find((p) => p.status === "captured");
}

function safeEqualHex(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Verify the checkout handler signature: HMAC_SHA256(order_id|payment_id, secret). */
export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
): boolean {
  const expected = crypto
    .createHmac("sha256", razorpayKeySecret())
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  return safeEqualHex(expected, signature);
}

/** Verify a webhook payload: HMAC_SHA256(rawBody, webhookSecret). */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", razorpayWebhookSecret())
    .update(rawBody)
    .digest("hex");
  return safeEqualHex(expected, signature);
}

/** Issue a refund for a captured payment. `amountPaise` omitted = full refund. */
export async function refundPayment(paymentId: string, amountPaise?: number): Promise<void> {
  const res = await fetch(`${BASE}/payments/${paymentId}/refund`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader() },
    body: JSON.stringify(amountPaise ? { amount: amountPaise } : {}),
    cache: "no-store",
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: { description?: string } };
    throw new Error(`Razorpay refund failed: ${data.error?.description ?? res.statusText}`);
  }
}
