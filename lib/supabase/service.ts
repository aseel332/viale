import "server-only";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { SUPABASE_URL } from "./env";

/**
 * Service-role Supabase client. Bypasses RLS — use ONLY in trusted server
 * contexts that have no user session, such as payment webhooks and other
 * system-driven writes to orders / order_events.
 *
 * Never import this into a Client Component or expose the key to the browser.
 */
let cached: SupabaseClient<Database> | undefined;

export function createServiceClient(): SupabaseClient<Database> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      'Missing required environment variable "SUPABASE_SERVICE_ROLE_KEY". ' +
        "Set it in .env.local (see .env.local.example) or your hosting provider's env settings.",
    );
  }

  if (!cached) {
    cached = createSupabaseClient<Database>(SUPABASE_URL, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
