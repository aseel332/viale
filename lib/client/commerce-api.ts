import type {
  AddCartItemInput,
  BuyNowInput,
  CartSummary,
  PlaceOrderInput,
  PlaceOrderResult,
  ReviewInput,
  ShippingQuoteResult,
  UpdateCartItemInput,
} from "@/types/commerce";

type ApiResult<T> = { data?: T; error?: string; status: number };

async function requestJson<T>(url: string, init: RequestInit): Promise<ApiResult<T>> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const payload = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) {
    return { status: response.status, error: payload.error ?? "Request failed." };
  }

  return { status: response.status, data: payload };
}

export async function addCartItem(input: AddCartItemInput) {
  return requestJson<{ cart: CartSummary }>("/api/cart", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateCartItem(id: string, input: UpdateCartItemInput) {
  return requestJson<{ cart: CartSummary }>(`/api/cart/items/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteCartItem(id: string) {
  return requestJson<{ cart: CartSummary }>(`/api/cart/items/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function toggleWishlist(productId: string) {
  return requestJson<{ added?: boolean }>("/api/wishlist", {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
}

export async function submitReview(input: ReviewInput) {
  return requestJson<{ ok: true }>("/api/reviews", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function placeOrder(input: PlaceOrderInput) {
  return requestJson<PlaceOrderResult>("/api/checkout", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getShippingQuote(postalCode: string, buyNow?: BuyNowInput | null) {
  return requestJson<ShippingQuoteResult>("/api/shipping/quote", {
    method: "POST",
    body: JSON.stringify({ postal_code: postalCode, buyNow: buyNow ?? undefined }),
  });
}

export type VerifyPaymentInput = {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export async function verifyPayment(input: VerifyPaymentInput) {
  return requestJson<{ orderId: string; status: string }>("/api/payment/verify", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type PaymentStatusResult = {
  orderId: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod: "razorpay" | "cod" | null;
  resumable: boolean;
  razorpay?: { orderId: string; amount: number; keyId: string };
};

/** Reconcile + read an order's payment state (powers resume/retry/polling). */
export async function getPaymentStatus(orderId: string) {
  return requestJson<PaymentStatusResult>("/api/payment/status", {
    method: "POST",
    body: JSON.stringify({ orderId }),
  });
}

/** Delete an unpaid order the buyer abandoned (no-op if it was actually paid). */
export async function abandonPayment(orderId: string) {
  return requestJson<{ deleted: boolean; paid: boolean }>("/api/payment/abandon", {
    method: "POST",
    body: JSON.stringify({ orderId }),
  });
}
