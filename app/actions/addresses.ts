"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AddressInsert, AddressUpdate } from "@/types/database";

export interface AddressActionState {
  error?: string;
  message?: string;
}

function readAddress(formData: FormData) {
  const label = (formData.get("label") as string | null)?.trim() || "Home";
  const fullName = (formData.get("full_name") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() || null;
  const line1 = (formData.get("line1") as string | null)?.trim() ?? "";
  const line2 = (formData.get("line2") as string | null)?.trim() || null;
  const landmark = (formData.get("landmark") as string | null)?.trim() || null;
  const city = (formData.get("city") as string | null)?.trim() ?? "";
  const state = (formData.get("state") as string | null)?.trim() ?? "";
  const postalCode = (formData.get("postal_code") as string | null)?.trim() ?? "";
  const isDefault = formData.get("is_default") === "on";

  if (!fullName) return { error: "Enter the recipient name." };
  if (!line1) return { error: "Enter the street address." };
  if (!state) return { error: "Select the state." };
  if (!city) return { error: "Enter the city." };
  if (!postalCode) return { error: "Enter the postal code." };

  return {
    value: {
      label,
      full_name: fullName,
      phone,
      line1,
      line2,
      landmark,
      city,
      state,
      postal_code: postalCode,
      country: "IN",
      is_default: isDefault,
    },
  };
}

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function addAddress(
  _prev: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  const { supabase, user } = await currentUser();
  if (!user) return { error: "You must be signed in." };

  const parsed = readAddress(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { count } = await supabase
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const shouldDefault = parsed.value.is_default || (count ?? 0) === 0;
  if (shouldDefault) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  }

  const payload: AddressInsert = {
    user_id: user.id,
    ...parsed.value,
    is_default: shouldDefault,
  };

  const { error } = await supabase.from("addresses").insert(payload);
  if (error) return { error: "Could not save address. Please try again." };

  revalidatePath("/account");
  revalidatePath("/checkout");
  return { message: "Address saved." };
}

export async function updateAddress(
  _prev: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  const { supabase, user } = await currentUser();
  if (!user) return { error: "You must be signed in." };

  const id = (formData.get("id") as string | null)?.trim();
  if (!id) return { error: "Missing address id." };

  const parsed = readAddress(formData);
  if ("error" in parsed) return { error: parsed.error };

  if (parsed.value.is_default) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  }

  const payload: AddressUpdate = parsed.value;
  const { error } = await supabase
    .from("addresses")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: "Could not update address. Please try again." };

  revalidatePath("/account");
  revalidatePath("/checkout");
  return { message: "Address updated." };
}

export async function deleteAddress(id: string): Promise<{ error?: string }> {
  const { supabase, user } = await currentUser();
  if (!user) return { error: "Not authenticated." };

  const { data: existing } = await supabase
    .from("addresses")
    .select("is_default")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  if (existing?.is_default) {
    const { data: next } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (next) {
      await supabase.from("addresses").update({ is_default: true }).eq("id", next.id);
    }
  }

  revalidatePath("/account");
  revalidatePath("/checkout");
  return {};
}

export async function setDefaultAddress(id: string): Promise<{ error?: string }> {
  const { supabase, user } = await currentUser();
  if (!user) return { error: "Not authenticated." };

  await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/account");
  revalidatePath("/checkout");
  return {};
}
