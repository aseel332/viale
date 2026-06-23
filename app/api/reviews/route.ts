import { NextResponse, type NextRequest } from "next/server";
import { submitReview } from "@/lib/server/reviews";
import { forbiddenIfCrossOrigin } from "@/lib/server/request-guards";
import type { ReviewInput } from "@/types/commerce";

export async function POST(request: NextRequest) {
  const forbidden = forbiddenIfCrossOrigin(request);
  if (forbidden) return NextResponse.json(forbidden, { status: 403 });

  let body: ReviewInput;
  try {
    body = await request.json() as ReviewInput;
  } catch {
    return NextResponse.json({ error: "Invalid review payload." }, { status: 400 });
  }

  const result = await submitReview(body);
  if (result.error === "You must be signed in to leave a review.") {
    return NextResponse.json(result, { status: 401 });
  }
  if (result.error) return NextResponse.json(result, { status: 400 });

  return NextResponse.json({ ok: true });
}
