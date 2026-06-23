"use server";

import { submitReview as submitReviewService } from "@/lib/server/reviews";

export async function submitReview(
  productId: string,
  rating: number,
  title: string,
  body: string,
): Promise<{ error?: string }> {
  return submitReviewService({ productId, rating, title, body });
}
