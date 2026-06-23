"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ActionState {
  error?: string;
  message?: string;
}

function detectBrand(cardNumber: string): string {
  const n = cardNumber.replace(/\s+/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^6(011|5)/.test(n)) return "Discover";
  return "Card";
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

// ── Add a saved payment method (display metadata only) ────────────────────────────
export async function addPaymentMethod(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const rawNumber = ((formData.get("card_number") as string | null) ?? "").replace(/\s+/g, "");
  const cardholder = (formData.get("cardholder_name") as string | null)?.trim() ?? "";
  const expMonth = Number(formData.get("exp_month"));
  const expYear = Number(formData.get("exp_year"));

  if (!/^\d{13,19}$/.test(rawNumber)) return { error: "Enter a valid card number." };
  if (!cardholder) return { error: "Enter the cardholder name." };
  if (!expMonth || expMonth < 1 || expMonth > 12) return { error: "Enter a valid expiry month." };
  if (!expYear || expYear < new Date().getFullYear()) return { error: "Enter a valid expiry year." };

  // Is this the first card? If so, make it the default.
  const { count } = await supabase
    .from("payment_methods")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { error } = await supabase.from("payment_methods").insert({
    user_id: user.id,
    brand: detectBrand(rawNumber),
    last4: rawNumber.slice(-4),       // store ONLY the last 4 — never the full PAN
    exp_month: expMonth,
    exp_year: expYear,
    cardholder_name: cardholder,
    is_default: (count ?? 0) === 0,
  });

  if (error) return { error: "Could not save card. Please try again." };

  revalidatePath("/account");
  return { message: "Card saved." };
}

export async function deletePaymentMethod(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("payment_methods")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/account");
  return {};
}

export async function setDefaultPaymentMethod(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  await supabase.from("payment_methods").update({ is_default: false }).eq("user_id", user.id);
  const { error } = await supabase
    .from("payment_methods")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/account");
  return {};
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
