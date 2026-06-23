import { NextResponse } from "next/server";
import { getStorefrontCollections } from "@/lib/catalog";

export async function GET() {
  const collections = await getStorefrontCollections();
  return NextResponse.json({ collections });
}
