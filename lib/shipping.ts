// Shipping rules — plain module (safe to import anywhere, unlike "use server" files).

export const SHIPPING_FLAT = 99;
export const FREE_SHIPPING_THRESHOLD = 2999;

export function shippingFor(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
}
