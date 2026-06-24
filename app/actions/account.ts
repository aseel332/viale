"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ActionState {
  error?: string;
  message?: string;
}

// ── Update profile contact ───────────────────────────────────────────────────────
export async function updateContactInfo(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const fullName = (formData.get("full_name") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() || null;

  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        full_name: fullName,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        phone,
      },
      { onConflict: "id" },
    );

  if (error) return { error: "Could not save your details. Please try again." };

  revalidatePath("/account");
  return { message: "Your details were saved." };
}

export async function removeFromWishlist(productId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId);

  if (error) return { error: error.message };
  revalidatePath("/account");
  return {};
}
