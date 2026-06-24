"use server";

import { redirect } from "next/navigation";
import { placeOrder, placeOrderInputFromFormData } from "@/lib/server/orders";

export async function placeOrderAction(formData: FormData): Promise<void> {
  const { result, error } = await placeOrder(placeOrderInputFromFormData(formData));

  if (error === "Not authenticated.") {
    redirect("/account?redirectTo=/checkout");
  }

  if (error === "Your bag is empty.") {
    redirect("/cart");
  }

  if (error || !result) {
    redirect(`/checkout?error=${encodeURIComponent(error ?? "Could not create your order. Please try again.")}`);
  }

  redirect(`/checkout/success?order=${result.orderId}`);
}

export { placeOrderAction as placeOrder };
