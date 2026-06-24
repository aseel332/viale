import "server-only";

import {
  customerShippingCharge,
  estimateWeightKg,
  shippingFor,
} from "@/lib/shipping";
import { getCheapestRate, isShiprocketConfigured } from "@/lib/integrations/shiprocket";
import type { CartLine } from "@/types/commerce";
import type { PaymentMethod, ShippingQuoteSnapshot } from "@/types/database";

export type ShippingOption = {
  available: boolean;
  charge: number;          // ₹ the customer pays (0 = free)
  baseRate: number;        // cheapest courier's full rate (₹)
  etdDays: number | null;
  courier: string | null;
};

export type CartShippingQuote = {
  serviceable: boolean;
  prepaid: ShippingOption;
  cod: ShippingOption;
};

export function isValidPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode.trim());
}

async function optionFor(
  lines: CartLine[],
  subtotal: number,
  pincode: string,
  cod: boolean,
): Promise<ShippingOption> {
  const flat = (): ShippingOption => {
    const charge = shippingFor(subtotal);
    return { available: true, charge, baseRate: charge, etdDays: null, courier: null };
  };

  // No live rates configured → flat-rate fallback (always "available").
  if (!isShiprocketConfigured()) return flat();

  try {
    const rate = await getCheapestRate({
      deliveryPincode: pincode,
      weightKg: estimateWeightKg(lines),
      declaredValue: subtotal,
      cod,
    });
    if (!rate) return { available: false, charge: 0, baseRate: 0, etdDays: null, courier: null };
    return {
      available: true,
      charge: customerShippingCharge(rate.rate, subtotal),
      baseRate: rate.rate,
      etdDays: rate.etdDays,
      courier: rate.courierName,
    };
  } catch {
    // Live lookup failed — degrade to flat rate rather than block checkout.
    return flat();
  }
}

/** Quote both payment options for the checkout UI. */
export async function quoteCartShipping(
  lines: CartLine[],
  subtotal: number,
  pincode: string,
): Promise<CartShippingQuote> {
  const [prepaid, cod] = await Promise.all([
    optionFor(lines, subtotal, pincode, false),
    optionFor(lines, subtotal, pincode, true),
  ]);
  return { serviceable: prepaid.available || cod.available, prepaid, cod };
}

/**
 * Server-authoritative shipping for a placed order. Recomputes the charge for
 * the chosen payment method — never trust the client's number.
 */
export async function resolveOrderShipping(
  lines: CartLine[],
  subtotal: number,
  pincode: string,
  method: PaymentMethod,
): Promise<{ available: boolean; charge: number; snapshot: ShippingQuoteSnapshot | null }> {
  const cod = method === "cod";
  const option = await optionFor(lines, subtotal, pincode, cod);
  if (!option.available) return { available: false, charge: 0, snapshot: null };

  const snapshot: ShippingQuoteSnapshot = {
    courier_name: option.courier ?? "Flat rate",
    base_rate: option.baseRate,
    charged: option.charge,
    etd_days: option.etdDays,
    cod,
  };
  return { available: true, charge: option.charge, snapshot };
}
