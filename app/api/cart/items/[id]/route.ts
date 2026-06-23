import { NextResponse, type NextRequest } from "next/server";
import { getCart, removeFromCart, updateCartQuantity } from "@/lib/server/cart";
import { forbiddenIfCrossOrigin } from "@/lib/server/request-guards";
import type { UpdateCartItemInput } from "@/types/commerce";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const forbidden = forbiddenIfCrossOrigin(request);
  if (forbidden) return NextResponse.json(forbidden, { status: 403 });

  const { id } = await params;
  let body: UpdateCartItemInput;
  try {
    body = await request.json() as UpdateCartItemInput;
  } catch {
    return NextResponse.json({ error: "Invalid cart update payload." }, { status: 400 });
  }

  const result = await updateCartQuantity(id, Number(body.quantity));
  if (result.error === "Not authenticated.") return NextResponse.json(result, { status: 401 });
  if (result.error) return NextResponse.json(result, { status: 400 });

  const cart = await getCart();
  return NextResponse.json({ cart });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const forbidden = forbiddenIfCrossOrigin(request);
  if (forbidden) return NextResponse.json(forbidden, { status: 403 });

  const { id } = await params;
  const result = await removeFromCart(id);
  if (result.error === "Not authenticated.") return NextResponse.json(result, { status: 401 });
  if (result.error) return NextResponse.json(result, { status: 400 });

  const cart = await getCart();
  return NextResponse.json({ cart });
}
