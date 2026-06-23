"use server";

import { redirect } from "next/navigation";
import { placeOrder, placeOrderInputFromFormData } from "@/lib/server/orders";

export async function placeOrderAction(formData: FormData): Promise<void> {
  const result = await placeOrder(placeOrderInputFromFormData(formData));

  if (result.error === "Not authenticated.") {
    redirect("/account?redirectTo=/checkout");
  }

  if (result.error === "Your bag is empty.") {
    redirect("/cart");
  }

  if (result.error || !result.orderId) {
    redirect(`/checkout?error=${encodeURIComponent(result.error ?? "Could not create your order. Please try again.")}`);
  }

  redirect(`/checkout/success?order=${result.orderId}`);
}

export { placeOrderAction as placeOrder };
