"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthFormState {
  error?: string;
  message?: string;
}

// ── Sign Up ───────────────────────────────────────────────────────────────────

export async function signUp(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const supabase = await createClient();

  const fullName = (formData.get("name") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return {
    message:
      "Account created! Check your email for a confirmation link before signing in.",
  };
}

// ── Sign In ───────────────────────────────────────────────────────────────────

export async function signIn(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const supabase = await createClient();

  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Generic message to avoid leaking whether the account exists
    return { error: "Invalid email or password." };
  }

  const redirectTo = (formData.get("redirectTo") as string | null)?.trim();
  revalidatePath("/", "layout");
  redirect(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/");
}

// ── Sign in with Google (OAuth) ─────────────────────────────────────────────────
export async function signInWithGoogle(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const headerList = await headers();
  const origin =
    headerList.get("origin") ??
    (headerList.get("host") ? `https://${headerList.get("host")}` : "");

  const redirectTo = (formData.get("redirectTo") as string | null)?.trim();
  const next = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data?.url) {
    redirect(`/account?error=${encodeURIComponent("Google sign-in failed. Try again.")}`);
  }

  redirect(data.url);
}

// ── Sign Out ──────────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/account");
}

// ── Update profile ────────────────────────────────────────────────────────────

export async function updateProfile(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to update your profile." };
  }

  const fullName = (formData.get("full_name") as string | null)?.trim() ?? "";

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (error) {
    return { error: "Failed to update profile. Please try again." };
  }

  revalidatePath("/account");
  return { message: "Profile updated." };
}
