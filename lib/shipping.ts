// Shipping rules — plain module (safe to import anywhere, unlike "use server" files).

import type { CartLine } from "@/types/commerce";

export const SHIPPING_FLAT = 99;
export const FREE_SHIPPING_THRESHOLD = 2999;

/** Customer pays this fraction of the cheapest live courier rate; Viale subsidises the rest. */
export const SHIPPING_SUBSIDY = 0.5;

/** Customer-facing delivery estimate shown across the storefront. */
export const DELIVERY_ESTIMATE = "4–10 days";

/** Flat-rate fallback used when live rates are unavailable. */
export function shippingFor(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
}

/**
 * What the customer is charged for shipping: 50% of the cheapest courier rate,
 * but free once the subtotal clears the free-shipping threshold.
 */
export function customerShippingCharge(baseRate: number, subtotal: number): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  if (!Number.isFinite(baseRate) || baseRate <= 0) return shippingFor(subtotal);
  return Math.round(baseRate * SHIPPING_SUBSIDY);
}

// ── Parcel weight estimation ─────────────────────────────────────────────────
// Decants are small; estimate parcel weight from bottle size + a box of 4 for
// collections. Shiprocket bills by 0.5 kg slabs, so we clamp to a sensible floor.
const WEIGHT_BY_SIZE_G: Record<number, number> = { 5: 40, 10: 60, 30: 120 };
const DEFAULT_ITEM_WEIGHT_G = 60;
const COLLECTION_WEIGHT_G = 260; // box of 4 decants + packaging
const MIN_PARCEL_KG = 0.5;

export function estimateWeightKg(lines: CartLine[]): number {
  const grams = lines.reduce((sum, line) => {
    const per =
      line.itemType === "collection"
        ? COLLECTION_WEIGHT_G
        : WEIGHT_BY_SIZE_G[line.sizeMl ?? 0] ?? DEFAULT_ITEM_WEIGHT_G;
    return sum + per * line.quantity;
  }, 0);
  return Math.max(MIN_PARCEL_KG, Math.round((grams / 1000) * 100) / 100);
}
