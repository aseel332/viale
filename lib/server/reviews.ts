import "server-only";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProductById } from "@/lib/catalog";
import type { ReviewInput } from "@/types/commerce";

export async function submitReview(input: ReviewInput): Promise<{ error?: string }> {
  const rating = Number(input.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Rating must be between 1 and 5." };
  }

  const product = await getProductById(input.productId);
  if (!product) return { error: "Product is unavailable." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to leave a review." };

  const { error } = await supabase
    .from("reviews")
    .upsert(
      {
        user_id: user.id,
        product_id: input.productId,
        rating,
        title: input.title?.trim() || null,
        body: input.body?.trim() || null,
      },
      { onConflict: "user_id,product_id" },
    );

  if (error) return { error: error.message };
  revalidatePath(`/products/${input.productId}`);
  return {};
}
