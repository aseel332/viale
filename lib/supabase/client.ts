import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env";

/**
 * Browser-side Supabase client.
 * Use inside Client Components ("use client").
 * Safe to call multiple times — reuses the same singleton per tab.
 */
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
