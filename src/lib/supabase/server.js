/**
 * SperoFlow — Server-side Supabase Client Factory.
 *
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Uses `@supabase/ssr` to handle cookie-based
 * session management through Next.js's `next/headers`.
 *
 * Usage:
 *   import { createClient } from '@/lib/supabase/server'
 *   const supabase = await createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Create a Supabase client configured for server-side usage.
 *
 * This client reads and writes session tokens via HTTP-only cookies,
 * ensuring secure authentication without exposing tokens to the browser.
 *
 * @returns {Promise<import('@supabase/supabase-js').SupabaseClient>}
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // `setAll` is called from a Server Component where cookies
            // cannot be set. This is safe to ignore because middleware
            // will refresh the session before the component renders.
          }
        },
      },
    }
  )
}
