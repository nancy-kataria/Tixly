import "server-only";
import { createClient } from "@supabase/supabase-js";

// Supabase client using the secret key. It skips Row Level Security, so use
// it only on the server and only for trusted work, like confirming Stripe
// payments. Never import it into client components.
export function createAdminClient() {
  if (!process.env.SUPABASE_SECRET_KEY) {
    throw new Error("SUPABASE_SECRET_KEY is not set");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
