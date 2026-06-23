import "server-only";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCart } from "@/lib/server/cart";
import { shippingFor } from "@/lib/shipping";
import type { CheckoutAddressInput, PlaceOrderInput } from "@/types/commerce";
import type { ShippingAddress } from "@/types/database";

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
  return {
    address: addressFromFormData(formData),
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

  if (address.country !== "IN") return "Viale currently ships within India only.";
  return null;
}

export async function placeOrder(input: PlaceOrderInput): Promise<{ orderId?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const addressError = validateAddress(input.address);
  if (addressError) return { error: addressError };

  const cart = await getCart();
  if (cart.lines.length === 0) return { error: "Your bag is empty." };

  const shipping = shippingFor(cart.subtotal);
  const total = cart.subtotal + shipping;
  const shippingAddress: ShippingAddress = {
    ...input.address,
    country: "IN",
  };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      total_amount: total,
      shipping_address: shippingAddress,
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

  await supabase.from("cart_items").delete().eq("user_id", user.id);
  revalidatePath("/", "layout");
  revalidatePath("/account");
  revalidatePath("/cart");
  revalidatePath("/checkout");
  return { orderId: order.id };
}
