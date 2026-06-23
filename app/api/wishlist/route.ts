import { NextResponse, type NextRequest } from "next/server";
import { toggleWishlist } from "@/lib/server/cart";
import { forbiddenIfCrossOrigin } from "@/lib/server/request-guards";

export async function POST(request: NextRequest) {
  const forbidden = forbiddenIfCrossOrigin(request);
  if (forbidden) return NextResponse.json(forbidden, { status: 403 });

  let productId = "";
  try {
    const body = await request.json() as { productId?: string };
    productId = body.productId?.trim() ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid wishlist payload." }, { status: 400 });
  }

  if (!productId) return NextResponse.json({ error: "Product id is required." }, { status: 400 });

  const result = await toggleWishlist(productId);
  if (result.error === "Not authenticated.") return NextResponse.json(result, { status: 401 });
  if (result.error) return NextResponse.json(result, { status: 400 });

  return NextResponse.json(result);
}
