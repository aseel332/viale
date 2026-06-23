import type {
  AddCartItemInput,
  CartSummary,
  PlaceOrderInput,
  ReviewInput,
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
  return requestJson<{ orderId: string }>("/api/checkout", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
