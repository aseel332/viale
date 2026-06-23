import { NextResponse, type NextRequest } from "next/server";
import { placeOrder } from "@/lib/server/orders";
import { forbiddenIfCrossOrigin } from "@/lib/server/request-guards";
import type { PlaceOrderInput } from "@/types/commerce";

export async function POST(request: NextRequest) {
  const forbidden = forbiddenIfCrossOrigin(request);
  if (forbidden) return NextResponse.json(forbidden, { status: 403 });

  let body: PlaceOrderInput;
  try {
    body = await request.json() as PlaceOrderInput;
  } catch {
    return NextResponse.json({ error: "Invalid checkout payload." }, { status: 400 });
  }

  const result = await placeOrder(body);
  if (result.error === "Not authenticated.") return NextResponse.json(result, { status: 401 });
  if (result.error) return NextResponse.json(result, { status: 400 });

  return NextResponse.json({ orderId: result.orderId });
}
