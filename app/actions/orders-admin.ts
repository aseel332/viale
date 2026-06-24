"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { recordOrderEvent } from "@/lib/server/order-events";
import { createShipment, isShiprocketConfigured, type ShiprocketOrderItem } from "@/lib/integrations/shiprocket";
import { refundPayment } from "@/lib/payments/razorpay";
import { estimateWeightKg } from "@/lib/shipping";
import type { CartLine } from "@/types/commerce";
import type { OrderStatus, PaymentMethod, ShippingAddress } from "@/types/database";

export type OrderActionState = { error?: string; message?: string };

const ADMIN_SETTABLE_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function flag(formData: FormData, name: string) {
  const value = formData.get(name);
  return value === "on" || value === "true" || value === "1";
}

function revalidateOrder(orderId: string) {
  revalidatePath("/admin");
  revalidatePath("/account");
  revalidatePath(`/account/orders/${orderId}`);
}

// ── Change fulfillment status ────────────────────────────────────────────────
export async function updateOrderStatusAdmin(formData: FormData): Promise<void> {
  const { supabase, user } = await requireAdmin();
  const orderId = field(formData, "order_id");
  const status = field(formData, "status") as OrderStatus;
  if (!orderId || !ADMIN_SETTABLE_STATUSES.includes(status)) return;

  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) throw new Error(error.message);

  await recordOrderEvent(
    {
      order_id: orderId,
      type: "status_change",
      title: `Order ${status}`,
      description: `Your order status was updated to ${status}.`,
      status,
      created_by: user.id,
    },
    supabase,
  );
  revalidateOrder(orderId);
}

// ── Post a customer-facing (or internal) update ──────────────────────────────
export async function addOrderUpdateAdmin(formData: FormData): Promise<void> {
  const { supabase, user } = await requireAdmin();
  const orderId = field(formData, "order_id");
  const title = field(formData, "title");
  const description = field(formData, "description") || null;
  if (!orderId || !title) return;

  await recordOrderEvent(
    {
      order_id: orderId,
      type: "note",
      title,
      description,
      is_customer_visible: flag(formData, "customer_visible"),
      created_by: user.id,
    },
    supabase,
  );
  revalidateOrder(orderId);
}

// ── Mark a COD order as paid (cash collected) ────────────────────────────────
export async function markCodPaidAdmin(formData: FormData): Promise<void> {
  const { supabase, user } = await requireAdmin();
  const orderId = field(formData, "order_id");
  if (!orderId) return;

  const { error } = await supabase
    .from("orders")
    .update({ payment_status: "paid" })
    .eq("id", orderId);
  if (error) throw new Error(error.message);

  await recordOrderEvent(
    {
      order_id: orderId,
      type: "payment",
      title: "Payment received",
      description: "Cash on Delivery payment collected.",
      created_by: user.id,
    },
    supabase,
  );
  revalidateOrder(orderId);
}

// ── Cancel an order ──────────────────────────────────────────────────────────
export async function cancelOrderAdmin(formData: FormData): Promise<void> {
  const { supabase, user } = await requireAdmin();
  const orderId = field(formData, "order_id");
  if (!orderId) return;

  const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
  if (error) throw new Error(error.message);

  await recordOrderEvent(
    {
      order_id: orderId,
      type: "status_change",
      title: "Order cancelled",
      description: field(formData, "reason") || "Your order has been cancelled.",
      status: "cancelled",
      created_by: user.id,
    },
    supabase,
  );
  revalidateOrder(orderId);
}

// ── Refund (Razorpay) ────────────────────────────────────────────────────────
export async function refundOrderAdmin(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  try {
    const { supabase, user } = await requireAdmin();
    const orderId = field(formData, "order_id");
    if (!orderId) return { error: "Missing order." };

    const { data: order } = await supabase
      .from("orders")
      .select("id, payment_method, payment_status, razorpay_payment_id")
      .eq("id", orderId)
      .maybeSingle();
    if (!order) return { error: "Order not found." };

    if (order.payment_method === "razorpay" && order.payment_status === "paid") {
      if (!order.razorpay_payment_id) return { error: "No payment id on this order." };
      await refundPayment(order.razorpay_payment_id);
    }

    const { error } = await supabase
      .from("orders")
      .update({ payment_status: "refunded", status: "refunded" })
      .eq("id", orderId);
    if (error) return { error: error.message };

    await recordOrderEvent(
      {
        order_id: orderId,
        type: "payment",
        title: "Refund processed",
        description: "Your refund has been processed and should reflect in 5–7 business days.",
        status: "refunded",
        created_by: user.id,
      },
      supabase,
    );
    revalidateOrder(orderId);
    return { message: "Refund processed." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not process refund." };
  }
}

// ── Push to Shiprocket (create shipment + AWB + pickup) ───────────────────────
export async function createShipmentAdmin(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  try {
    if (!isShiprocketConfigured()) {
      return { error: "Shiprocket is not configured. Add SHIPROCKET_* env vars." };
    }

    const { supabase, user } = await requireAdmin();
    const orderId = field(formData, "order_id");
    if (!orderId) return { error: "Missing order." };

    type RawItem = {
      product_id: string | null;
      collection_id: string | null;
      size_ml: number | null;
      quantity: number;
      unit_price: number;
    };
    type RawOrder = {
      id: string;
      status: OrderStatus;
      payment_method: PaymentMethod | null;
      subtotal: number | null;
      total_amount: number;
      shipping_charge: number | null;
      shipping_address: ShippingAddress | null;
      contact_email: string | null;
      contact_phone: string | null;
      awb_code: string | null;
      created_at: string;
      order_items: RawItem[] | null;
    };

    const { data } = await supabase
      .from("orders")
      .select(
        "id, status, payment_method, subtotal, total_amount, shipping_charge, shipping_address, contact_email, contact_phone, awb_code, created_at, " +
          "order_items(product_id, collection_id, size_ml, quantity, unit_price)",
      )
      .eq("id", orderId)
      .maybeSingle();

    const order = data as unknown as RawOrder | null;
    if (!order) return { error: "Order not found." };
    if (order.awb_code) return { error: "A shipment already exists for this order." };

    const rawItems = order.order_items ?? [];
    if (rawItems.length === 0) return { error: "Order has no items." };

    const address = order.shipping_address as ShippingAddress | null;
    if (!address) return { error: "Order has no shipping address." };

    // Resolve product / collection display names for the courier manifest.
    const productIds = rawItems.map((i) => i.product_id).filter((v): v is string => Boolean(v));
    const collectionIds = rawItems.map((i) => i.collection_id).filter((v): v is string => Boolean(v));
    const [{ data: products }, { data: collections }] = await Promise.all([
      productIds.length
        ? supabase.from("products").select("id, name, brand").in("id", productIds)
        : Promise.resolve({ data: [] as { id: string; name: string; brand: string }[] }),
      collectionIds.length
        ? supabase.from("collections").select("id, name").in("id", collectionIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    ]);
    const productName = (id: string) => {
      const p = products?.find((x) => x.id === id);
      return p ? `${p.brand} ${p.name}` : id;
    };
    const collectionName = (id: string) => collections?.find((x) => x.id === id)?.name ?? "Collection";

    const items: ShiprocketOrderItem[] = rawItems.map((i, idx) => ({
      name: i.product_id
        ? `${productName(i.product_id)}${i.size_ml ? ` ${i.size_ml}ml` : ""}`
        : collectionName(i.collection_id ?? ""),
      sku: i.product_id ? `${i.product_id}-${i.size_ml ?? 0}` : `col-${i.collection_id ?? idx}`,
      units: i.quantity,
      selling_price: Number(i.unit_price),
    }));

    const lines: CartLine[] = rawItems.map((i, idx) => ({
      id: String(idx),
      itemType: i.product_id ? "product" : "collection",
      refId: i.product_id ?? i.collection_id ?? "",
      name: "",
      brand: "",
      imageSrc: "",
      sizeMl: i.size_ml,
      quantity: i.quantity,
      unitPrice: Number(i.unit_price),
      lineTotal: Number(i.unit_price) * i.quantity,
    }));

    const subTotal = Number(order.subtotal ?? Number(order.total_amount) - Number(order.shipping_charge ?? 0));

    const result = await createShipment({
      orderId: order.id,
      createdAt: order.created_at,
      billing: {
        name: address.full_name,
        address: [address.line1, address.line2].filter(Boolean).join(", "),
        address2: address.landmark ?? "",
        city: address.city,
        state: address.state,
        pincode: address.postal_code,
        email: order.contact_email ?? "",
        phone: order.contact_phone ?? address.phone ?? "",
      },
      items,
      subTotal,
      weightKg: estimateWeightKg(lines),
      paymentMethod: order.payment_method === "cod" ? "COD" : "Prepaid",
    });

    const { error } = await supabase
      .from("orders")
      .update({
        status: "shipped",
        shiprocket_order_id: result.shiprocketOrderId,
        shiprocket_shipment_id: result.shipmentId,
        awb_code: result.awbCode,
        courier_name: result.courierName,
        tracking_url: result.trackingUrl,
        label_url: result.labelUrl,
      })
      .eq("id", order.id);
    if (error) return { error: error.message };

    await recordOrderEvent(
      {
        order_id: order.id,
        type: "shipment",
        title: "Shipped",
        description: `Your order is on its way via ${result.courierName} (AWB ${result.awbCode}).`,
        status: "shipped",
        created_by: user.id,
      },
      supabase,
    );
    revalidateOrder(order.id);
    return { message: `Shipment created via ${result.courierName} (AWB ${result.awbCode}).` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create shipment." };
  }
}
