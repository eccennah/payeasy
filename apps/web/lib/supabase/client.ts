import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "dummy_key";

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Missing Supabase environment variables. Using empty strings for build purposes.");
  }

  return createSupabaseBrowserClient(supabaseUrl, supabaseKey);
}

// Alias for backward compatibility
export const createClient = createBrowserClient;

export function getSupabaseClient() {
  if (!browserClient) {
    browserClient = createBrowserClient();
  }
  return browserClient;
}

// Alias for backward compatibility
export const getClient = getSupabaseClient;

export function resetClientInstance() {
  browserClient = null;
}
