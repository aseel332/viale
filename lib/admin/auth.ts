import "server-only";

import type { User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AdminUserRow, Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminContext = {
  supabase: SupabaseClient<Database>;
  user: User;
  admin: AdminUserRow;
};

function constantTimeEqual(a: string, b: string) {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;

  for (let index = 0; index < length; index += 1) {
    diff |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }

  return diff === 0;
}

export function isAgentTokenAuthorized(request: NextRequest) {
  const expected = process.env.PERFUME_AGENT_TOKEN;
  if (!expected || expected.length < 32) return false;

  const authorization = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!authorization.startsWith(prefix)) return false;

  return constantTimeEqual(authorization.slice(prefix.length), expected);
}

export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: admin, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !admin) return null;

  return { supabase, user, admin };
}

export async function requireAdmin(): Promise<AdminContext> {
  const context = await getAdminContext();
  if (!context) throw new Error("Unauthorized admin action.");
  return context;
}

export async function requireAdminPage(): Promise<AdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/account?redirectTo=/admin");

  const { data: admin, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !admin) notFound();

  return { supabase, user, admin };
}
