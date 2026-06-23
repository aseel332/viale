// Centralised, fail-fast access to the Supabase environment variables.
// Throws a clear error at the call site instead of a cryptic runtime crash
// somewhere deep inside the Supabase SDK when a var is missing on the host.

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Set it in .env.local (see .env.local.example) or your hosting provider's env settings.`,
    );
  }
  return value;
}

export const SUPABASE_URL = required(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

export const SUPABASE_ANON_KEY = required(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
