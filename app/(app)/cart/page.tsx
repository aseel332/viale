import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCart } from "@/lib/server/cart";
import { shippingFor } from "@/lib/shipping";
import CartClient from "./CartClient";

export const metadata = { title: "Your Bag — Viale" };

export default async function CartPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const cart = await getCart();

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-28 pb-20">
      <div className="max-w-screen-xl mx-auto px-5 md:px-10">
        <div className="mb-10">
          <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A86C] mb-2">Your Selection</p>
          <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111]">
            Shopping Bag
          </h1>
        </div>

        {!user ? (
          <div className="border border-[#E8E4DE] bg-white p-10 text-center max-w-md">
            <p className="text-[14px] text-[#4A4A4A] mb-5">
              Sign in to view your bag and check out.
            </p>
            <Link
              href="/account?redirectTo=/cart"
              className="inline-block bg-[#111] text-white text-[11px] tracking-[0.2em] uppercase px-8 py-3.5 hover:bg-[#333] transition-colors"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <CartClient
            initialLines={cart.lines}
            subtotal={cart.subtotal}
            shipping={shippingFor(cart.subtotal)}
          />
        )}
      </div>
    </div>
  );
}
