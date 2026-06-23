import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCart } from "@/lib/server/cart";
import { shippingFor } from "@/lib/shipping";
import type { AddressRow, PaymentMethodRow } from "@/types/database";
import CheckoutClient from "./CheckoutClient";

export const metadata = { title: "Checkout — Viale" };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account?redirectTo=/checkout");

  const cart = await getCart();
  if (cart.lines.length === 0) redirect("/cart");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  const { data: defaultAddress } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .maybeSingle();

  const { data: cards } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false });

  return (
    <CheckoutClient
      lines={cart.lines}
      subtotal={cart.subtotal}
      shipping={shippingFor(cart.subtotal)}
      defaultAddress={(defaultAddress as AddressRow | null) ?? null}
      defaultName={profile?.full_name ?? ""}
      defaultPhone={profile?.phone ?? ""}
      cards={(cards as PaymentMethodRow[] | null) ?? []}
      error={error}
    />
  );
}
