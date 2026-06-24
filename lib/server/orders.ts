import "server-only";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildBuyNowSummary, getCart } from "@/lib/server/cart";
import { resolveOrderShipping, isValidPincode } from "@/lib/server/shipping";
import { recordOrderEvent } from "@/lib/server/order-events";
import { createRazorpayOrder, isRazorpayConfigured } from "@/lib/payments/razorpay";
import { razorpayKeyId } from "@/lib/integrations/env";
import type {
  CheckoutAddressInput,
  PaymentMethodChoice,
  PlaceOrderInput,
  PlaceOrderResult,
} from "@/types/commerce";
import type { PaymentMethod, ShippingAddress } from "@/types/database";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function addressFromFormData(formData: FormData): CheckoutAddressInput {
  return {
    full_name: clean(formData.get("full_name")),
    phone: clean(formData.get("phone")) || undefined,
    line1: clean(formData.get("line1")),
    line2: clean(formData.get("line2")) || undefined,
    landmark: clean(formData.get("landmark")) || undefined,
    city: clean(formData.get("city")),
    state: clean(formData.get("state")),
    postal_code: clean(formData.get("postal_code")),
    country: "IN",
  };
}

export function placeOrderInputFromFormData(formData: FormData): PlaceOrderInput {
  const method = clean(formData.get("payment_method"));
  return {
    address: addressFromFormData(formData),
    paymentMethod: method === "cod" ? "cod" : "razorpay",
    contactEmail: clean(formData.get("contact_email")) || null,
    notes: clean(formData.get("notes")) || null,
  };
}

function validateAddress(address: CheckoutAddressInput) {
  const required: Array<[keyof CheckoutAddressInput, string]> = [
    ["full_name", "Full name"],
    ["line1", "Address line 1"],
    ["city", "City"],
    ["state", "State"],
    ["postal_code", "Postal code"],
  ];

  for (const [key, label] of required) {
    if (!address[key]) return `${label} is required.`;
  }

  if (!isValidPincode(address.postal_code)) return "Enter a valid 6-digit pincode.";
  if (address.country !== "IN") return "Viale currently ships within India only.";
  return null;
}

export type PlaceOrderResponse = { result?: PlaceOrderResult; error?: string };

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const addressError = validateAddress(input.address);
  if (addressError) return { error: addressError };

  const method: PaymentMethodChoice = input.paymentMethod === "cod" ? "cod" : "razorpay";
  if (method === "razorpay" && !isRazorpayConfigured()) {
    return { error: "Online payment is currently unavailable. Please choose Cash on Delivery." };
  }

  // "Buy Now" checks out a single product without touching the persistent cart.
  const isBuyNow = Boolean(input.buyNow);
  const cart = input.buyNow ? await buildBuyNowSummary(input.buyNow) : await getCart();
  if (cart.lines.length === 0) {
    return { error: isBuyNow ? "This product is unavailable." : "Your bag is empty." };
  }

  // Server-authoritative shipping — recompute, never trust the client.
  const shipping = await resolveOrderShipping(
    cart.lines,
    cart.subtotal,
    input.address.postal_code,
    method as PaymentMethod,
  );
  if (!shipping.available) {
    return { error: "We're unable to ship to this pincode yet. Please try another address." };
  }

  const total = cart.subtotal + shipping.charge;
  const shippingAddress: ShippingAddress = { ...input.address, country: "IN" };
  const contactEmail = input.contactEmail?.trim() || user.email || null;
  const contactPhone = input.address.phone?.trim() || null;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      // COD is confirmed immediately; Razorpay waits for payment capture.
      status: method === "cod" ? "processing" : "pending",
      payment_method: method,
      payment_status: "pending",
      total_amount: total,
      subtotal: cart.subtotal,
      shipping_charge: shipping.charge,
      shipping_quote: shipping.snapshot,
      shipping_address: shippingAddress,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      notes: input.notes?.trim() || null,
    })
    .select("id")
    .single();

  if (orderError || !order) return { error: "Could not create your order. Please try again." };

  const items = cart.lines.map((line) => ({
    order_id: order.id,
    product_id: line.itemType === "product" ? line.refId : null,
    collection_id: line.itemType === "collection" ? line.refId : null,
    size_ml: line.sizeMl,
    quantity: line.quantity,
    unit_price: line.unitPrice,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(items);
  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id).eq("user_id", user.id);
    return { error: "Could not save your items. Please try again." };
  }

  // ── COD: confirmed now ──────────────────────────────────────────────────────
  if (method === "cod") {
    // A Buy Now order never entered the cart, so leave existing cart items alone.
    if (!isBuyNow) {
      await supabase.from("cart_items").delete().eq("user_id", user.id);
    }
    await recordOrderEvent({
      order_id: order.id,
      type: "status_change",
      title: "Order placed",
      description: "Your Cash on Delivery order has been received and is being prepared.",
      status: "processing",
    });
    revalidatePaths();
    return { result: { orderId: order.id, paymentMethod: "cod" } };
  }

  // ── Razorpay: create gateway order; cart cleared after payment capture ───────
  try {
    const rzpOrder = await createRazorpayOrder(Math.round(total * 100), order.id, {
      order_id: order.id,
      user_id: user.id,
    });
    await supabase
      .from("orders")
      .update({ razorpay_order_id: rzpOrder.id })
      .eq("id", order.id)
      .eq("user_id", user.id);

    revalidatePaths();
    return {
      result: {
        orderId: order.id,
        paymentMethod: "razorpay",
        razorpay: { orderId: rzpOrder.id, amount: rzpOrder.amount, keyId: razorpayKeyId() },
      },
    };
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    await supabase.from("order_items").delete().eq("order_id", order.id);
    await supabase.from("orders").delete().eq("id", order.id).eq("user_id", user.id);
    return { error: "Could not start the payment. Please try again." };
  }
}

function revalidatePaths() {
  revalidatePath("/", "layout");
  revalidatePath("/account");
  revalidatePath("/cart");
  revalidatePath("/checkout");
}
