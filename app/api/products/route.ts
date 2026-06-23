import { NextResponse } from "next/server";
import { getStorefrontProducts } from "@/lib/catalog";

export async function GET() {
  const products = await getStorefrontProducts();
  return NextResponse.json({ products });
}
