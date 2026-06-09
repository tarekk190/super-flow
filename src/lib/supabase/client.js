/**
 * SperoFlow — Browser-side Supabase Client.
 *
 * Creates a Supabase client for use in Client Components (hooks,
 * event handlers, etc.). Uses `createBrowserClient` from
 * `@supabase/ssr` which automatically handles cookie-based
 * session storage in the browser.
 *
 * Usage:
 *   import { createClient } from '@/lib/supabase/client'
 *   const supabase = createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 */

import { createBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase client for browser-side usage.
 *
 * This client automatically manages session tokens via cookies
 * and handles token refresh. It is safe to call this function
 * multiple times — the SDK internally deduplicates instances.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
