import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildBuyNowSummary, getCart } from "@/lib/server/cart";
import { isRazorpayConfigured } from "@/lib/integrations/env";
import { BOTTLE_SIZES, type BottleSize } from "@/lib/product-utils";
import type { AddressRow } from "@/types/database";
import type { BuyNowInput } from "@/types/commerce";
import CheckoutClient from "./CheckoutClient";

export const metadata = { title: "Checkout — Viale" };

function parseBottleSize(value: string | undefined): BottleSize {
  const n = Number(value);
  return (BOTTLE_SIZES as readonly number[]).includes(n) ? (n as BottleSize) : 5;
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; buyNow?: string; size?: string }>;
}) {
  const { error, buyNow: buyNowId, size } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const target = buyNowId
      ? `/checkout?buyNow=${encodeURIComponent(buyNowId)}&size=${parseBottleSize(size)}`
      : "/checkout";
    redirect(`/account?redirectTo=${encodeURIComponent(target)}`);
  }

  // Buy Now: build a single-product summary and never touch the cart.
  const buyNow: BuyNowInput | null = buyNowId
    ? { productId: buyNowId, sizeMl: parseBottleSize(size), quantity: 1 }
    : null;

  const cart = buyNow ? await buildBuyNowSummary(buyNow) : await getCart();
  if (cart.lines.length === 0) {
    // Empty cart → bag page; an unavailable Buy Now product → back home.
    redirect(buyNow ? "/" : "/cart");
  }

  const [{ data: profile }, { data: addresses }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true }),
  ]);

  return (
    <CheckoutClient
      lines={cart.lines}
      subtotal={cart.subtotal}
      addresses={(addresses as AddressRow[] | null) ?? []}
      defaultName={profile?.full_name ?? ""}
      defaultPhone={profile?.phone ?? ""}
      defaultEmail={user.email ?? ""}
      onlinePaymentAvailable={isRazorpayConfigured()}
      buyNow={buyNow}
      error={error}
    />
  );
}
