import { NextResponse, type NextRequest } from "next/server";
import { getStorefrontCollectionById } from "@/lib/catalog";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const collection = await getStorefrontCollectionById(id);

  if (!collection) {
    return NextResponse.json({ error: "Collection not found." }, { status: 404 });
  }

  return NextResponse.json({ collection });
}
