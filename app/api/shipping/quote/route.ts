import { NextResponse, type NextRequest } from "next/server";
import { buildBuyNowSummary, getCart } from "@/lib/server/cart";
import { createClient } from "@/lib/supabase/server";
import { forbiddenIfCrossOrigin } from "@/lib/server/request-guards";
import { isValidPincode, quoteCartShipping } from "@/lib/server/shipping";
import type { BuyNowInput } from "@/types/commerce";

export async function POST(request: NextRequest) {
  const forbidden = forbiddenIfCrossOrigin(request);
  if (forbidden) return NextResponse.json(forbidden, { status: 403 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let postalCode = "";
  let buyNow: BuyNowInput | undefined;
  try {
    const body = (await request.json()) as { postal_code?: string; buyNow?: BuyNowInput };
    postalCode = (body.postal_code ?? "").trim();
    buyNow = body.buyNow ?? undefined;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!isValidPincode(postalCode)) {
    return NextResponse.json({ error: "Enter a valid 6-digit pincode." }, { status: 400 });
  }

  // Quote the Buy Now product on its own when present, otherwise the whole cart.
  const cart = buyNow ? await buildBuyNowSummary(buyNow) : await getCart();
  if (cart.lines.length === 0) {
    return NextResponse.json(
      { error: buyNow ? "This product is unavailable." : "Your bag is empty." },
      { status: 400 },
    );
  }

  const quote = await quoteCartShipping(cart.lines, cart.subtotal, postalCode);
  return NextResponse.json(quote);
}
