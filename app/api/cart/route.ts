import { NextResponse, type NextRequest } from "next/server";
import { addCartItem, getCart } from "@/lib/server/cart";
import { forbiddenIfCrossOrigin } from "@/lib/server/request-guards";
import type { AddCartItemInput } from "@/types/commerce";

export async function GET() {
  const cart = await getCart();
  return NextResponse.json({ cart });
}

export async function POST(request: NextRequest) {
  const forbidden = forbiddenIfCrossOrigin(request);
  if (forbidden) return NextResponse.json(forbidden, { status: 403 });

  let body: AddCartItemInput;
  try {
    body = await request.json() as AddCartItemInput;
  } catch {
    return NextResponse.json({ error: "Invalid cart payload." }, { status: 400 });
  }

  const result = await addCartItem(body);
  if (result.error === "Not authenticated.") {
    return NextResponse.json(result, { status: 401 });
  }
  if (result.error) {
    return NextResponse.json(result, { status: 400 });
  }

  const cart = await getCart();
  return NextResponse.json({ cart });
}
