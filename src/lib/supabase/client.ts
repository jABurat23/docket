// Browser-side Supabase client, used from Client Components.
// Relies on the public anon key — safe to expose, since every table
// is protected by Row Level Security (see the migration file).
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
