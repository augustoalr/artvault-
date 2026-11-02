/**
 * Supabase Browser Client Wrapper
 * Agnosticismo de Dependencias: This wrapper isolates the Supabase SDK
 * so the rest of the application depends on this interface, not the library directly.
 */
import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/lib/supabase/types';

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (client) return client;

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}
