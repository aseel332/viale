import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import type { Database, OrderEventInsert } from "@/types/database";

/**
 * Append an event to an order's timeline. System/automated writes (order placed,
 * payment, webhooks) use the service-role client; admin actions pass their own
 * authenticated client (covered by the admin RLS insert policy). Non-fatal: a
 * failed timeline write must never break order placement or payment capture.
 */
export async function recordOrderEvent(
  event: OrderEventInsert,
  client?: SupabaseClient<Database>,
): Promise<void> {
  try {
    const supabase = client ?? createServiceClient();
    const { error } = await supabase.from("order_events").insert(event);
    if (error) console.error("recordOrderEvent insert failed:", error.message);
  } catch (err) {
    console.error("recordOrderEvent failed:", err);
  }
}
