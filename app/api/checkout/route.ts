import { NextResponse, type NextRequest } from "next/server";
import { placeOrder } from "@/lib/server/orders";
import { forbiddenIfCrossOrigin } from "@/lib/server/request-guards";
import type { PlaceOrderInput } from "@/types/commerce";

export async function POST(request: NextRequest) {
  const forbidden = forbiddenIfCrossOrigin(request);
  if (forbidden) return NextResponse.json(forbidden, { status: 403 });

  let body: PlaceOrderInput;
  try {
    body = (await request.json()) as PlaceOrderInput;
  } catch {
    return NextResponse.json({ error: "Invalid checkout payload." }, { status: 400 });
  }

  const { result, error } = await placeOrder(body);
  if (error === "Not authenticated.") return NextResponse.json({ error }, { status: 401 });
  if (error || !result) return NextResponse.json({ error: error ?? "Checkout failed." }, { status: 400 });

  return NextResponse.json(result);
}
