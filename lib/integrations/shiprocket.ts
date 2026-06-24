import "server-only";

import { cacheGet, cacheSet } from "@/lib/cache/redis";
import {
  shiprocketEmail,
  shiprocketPassword,
  shiprocketPickupLocation,
  shiprocketPickupPincode,
  isShiprocketConfigured,
} from "./env";

const BASE = "https://apiv2.shiprocket.in/v1/external";
const TOKEN_CACHE_KEY = "shiprocket:token";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 9; // tokens last ~10 days; refresh at 9

export { isShiprocketConfigured };

// ── Auth ──────────────────────────────────────────────────────────────────────
let memoToken: { token: string; expiresAt: number } | null = null;

async function login(): Promise<string> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: shiprocketEmail(), password: shiprocketPassword() }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { token?: string; message?: string };
  if (!res.ok || !data.token) {
    throw new Error(`Shiprocket auth failed: ${data.message ?? res.statusText}`);
  }
  return data.token;
}

async function getToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && memoToken && memoToken.expiresAt > now) return memoToken.token;

  if (!forceRefresh) {
    const cached = await cacheGet<string>(TOKEN_CACHE_KEY);
    if (cached) {
      memoToken = { token: cached, expiresAt: now + TOKEN_TTL_SECONDS * 1000 };
      return cached;
    }
  }

  const token = await login();
  memoToken = { token, expiresAt: now + TOKEN_TTL_SECONDS * 1000 };
  await cacheSet(TOKEN_CACHE_KEY, token, TOKEN_TTL_SECONDS);
  return token;
}

async function srFetch<T>(
  path: string,
  init: RequestInit & { retryOn401?: boolean } = {},
): Promise<T> {
  const { retryOn401 = true, ...rest } = init;
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...rest.headers,
    },
    cache: "no-store",
  });

  if (res.status === 401 && retryOn401) {
    await getToken(true);
    return srFetch<T>(path, { ...init, retryOn401: false });
  }

  const data = (await res.json().catch(() => ({}))) as T & { message?: string };
  if (!res.ok) {
    throw new Error(`Shiprocket ${path} failed: ${data.message ?? res.statusText}`);
  }
  return data;
}

// ── Serviceability / rates ───────────────────────────────────────────────────
type CourierCompany = {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  estimated_delivery_days?: string;
  etd?: string;
};

type ServiceabilityResponse = {
  status?: number;
  data?: { available_courier_companies?: CourierCompany[] };
};

export type CheapestRate = {
  rate: number;
  courierName: string;
  courierId: number;
  etdDays: number | null;
};

function parseEtdDays(c: CourierCompany): number | null {
  const n = Number(c.estimated_delivery_days);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Cheapest serviceable courier for a destination, or null if none serviceable. */
export async function getCheapestRate(params: {
  deliveryPincode: string;
  weightKg: number;
  declaredValue: number;
  cod: boolean;
}): Promise<CheapestRate | null> {
  const query = new URLSearchParams({
    pickup_postcode: shiprocketPickupPincode(),
    delivery_postcode: params.deliveryPincode,
    weight: String(params.weightKg),
    cod: params.cod ? "1" : "0",
    declared_value: String(Math.max(1, Math.round(params.declaredValue))),
  });

  const data = await srFetch<ServiceabilityResponse>(`/courier/serviceability/?${query.toString()}`, {
    method: "GET",
  });

  const couriers = data.data?.available_courier_companies ?? [];
  if (couriers.length === 0) return null;

  const cheapest = couriers.reduce((min, c) => (c.rate < min.rate ? c : min));
  return {
    rate: cheapest.rate,
    courierName: cheapest.courier_name,
    courierId: cheapest.courier_company_id,
    etdDays: parseEtdDays(cheapest),
  };
}

// ── Fulfillment ───────────────────────────────────────────────────────────────
export type ShiprocketOrderItem = {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
};

export type CreateShipmentInput = {
  orderId: string;          // our internal order id → Shiprocket "order_id"
  createdAt: string;        // ISO; Shiprocket wants "YYYY-MM-DD HH:mm"
  billing: {
    name: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    pincode: string;
    email: string;
    phone: string;
  };
  items: ShiprocketOrderItem[];
  subTotal: number;
  weightKg: number;
  paymentMethod: "Prepaid" | "COD";
};

export type ShipmentResult = {
  shiprocketOrderId: string;
  shipmentId: string;
  awbCode: string;
  courierName: string;
  trackingUrl: string;
  labelUrl: string | null;
};

function formatSrDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Full fulfillment flow: create the Shiprocket order, assign the cheapest AWB,
 * and request a pickup. Returns the courier identifiers to persist on the order.
 */
export async function createShipment(input: CreateShipmentInput): Promise<ShipmentResult> {
  const created = await srFetch<{ order_id?: number; shipment_id?: number; status_code?: number }>(
    "/orders/create/adhoc",
    {
      method: "POST",
      body: JSON.stringify({
        order_id: input.orderId,
        order_date: formatSrDate(input.createdAt),
        pickup_location: shiprocketPickupLocation(),
        billing_customer_name: input.billing.name,
        billing_last_name: "",
        billing_address: input.billing.address,
        billing_address_2: input.billing.address2 ?? "",
        billing_city: input.billing.city,
        billing_pincode: input.billing.pincode,
        billing_state: input.billing.state,
        billing_country: "India",
        billing_email: input.billing.email,
        billing_phone: input.billing.phone,
        shipping_is_billing: true,
        order_items: input.items,
        payment_method: input.paymentMethod,
        sub_total: input.subTotal,
        length: 15,
        breadth: 12,
        height: 6,
        weight: input.weightKg,
      }),
    },
  );

  if (!created.order_id || !created.shipment_id) {
    throw new Error("Shiprocket order creation did not return a shipment id.");
  }

  const shipmentId = String(created.shipment_id);

  // Assign cheapest available courier (no courier_id → Shiprocket picks cheapest).
  const awb = await srFetch<{
    response?: {
      data?: { awb_code?: string; courier_name?: string };
    };
    awb_assign_status?: number;
    message?: string;
  }>("/courier/assign/awb", {
    method: "POST",
    body: JSON.stringify({ shipment_id: Number(shipmentId) }),
  });

  const awbCode = awb.response?.data?.awb_code ?? "";
  const courierName = awb.response?.data?.courier_name ?? "";
  if (!awbCode) {
    throw new Error(`Could not assign AWB: ${awb.message ?? "no courier available"}`);
  }

  // Request pickup (best-effort — failure here shouldn't lose the AWB).
  try {
    await srFetch("/courier/generate/pickup", {
      method: "POST",
      body: JSON.stringify({ shipment_id: [Number(shipmentId)] }),
    });
  } catch {
    // pickup can be requested later from the panel; ignore.
  }

  // Generate the shipping label (best-effort).
  let labelUrl: string | null = null;
  try {
    const label = await srFetch<{ label_url?: string }>("/courier/generate/label", {
      method: "POST",
      body: JSON.stringify({ shipment_id: [Number(shipmentId)] }),
    });
    labelUrl = label.label_url ?? null;
  } catch {
    labelUrl = null;
  }

  return {
    shiprocketOrderId: String(created.order_id),
    shipmentId,
    awbCode,
    courierName,
    trackingUrl: `https://shiprocket.co/tracking/${awbCode}`,
    labelUrl,
  };
}
