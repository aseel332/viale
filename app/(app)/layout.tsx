import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { getCartCount } from "@/lib/server/cart";
import { getStorefrontProducts } from "@/lib/catalog";
import { effectiveBasePrice, formatPrice } from "@/lib/product-utils";

const AppLayout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [cartCount, products] = await Promise.all([
    user ? getCartCount() : Promise.resolve(0),
    getStorefrontProducts(),
  ]);
  const fromPrice = products.length
    ? formatPrice(Math.min(...products.map(effectiveBasePrice)))
    : formatPrice(0);

  return (
    <>
      <Navbar isSignedIn={!!user} cartCount={cartCount} />
      <main className="flex-1 bg-[#FAFAF8]">{children}</main>
      <Footer fromPrice={fromPrice} />
    </>
  );
};

export default AppLayout;
