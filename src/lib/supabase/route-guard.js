/**
 * SperoFlow — Supabase Auth Guard for Next.js Route Handlers.
 *
 * Provides a single `requireAuth()` helper that:
 *   1. Creates a Supabase server client with the request cookies
 *   2. Calls `getUser()` — which makes a round-trip to Supabase to
 *      VERIFY the JWT (not just decode it from the cookie)
 *   3. Extracts the access token from the session for forwarding to
 *      the FastAPI backend
 *
 * Usage inside any Route Handler:
 *
 *   import { requireAuth } from '@/lib/supabase/route-guard'
 *
 *   export async function POST(request) {
 *     const { user, token, errorResponse } = await requireAuth()
 *     if (errorResponse) return errorResponse   // 401 already prepared
 *
 *     // user.id, user.email are safe to use
 *     // token forwards the JWT to the FastAPI backend
 *   }
 *
 * Security notes:
 *   - `getUser()` validates the token with Supabase's server — it cannot
 *     be spoofed by modifying the cookie.
 *   - `getSession()` is only called AFTER `getUser()` succeeds, and only
 *     to extract the access token for backend forwarding.
 *   - Never trust `userId` from the request body — always use `user.id`.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Authenticate the request using Supabase session cookies.
 *
 * IMPORTANT — always use the returned `supabase` client for all subsequent
 * database operations in the same Route Handler.  Do NOT call createClient()
 * again after requireAuth(): if getUser() triggered a silent token refresh
 * the new access token lives only in this client instance; a second client
 * would read the stale cookie and PostgREST would see no valid JWT, causing
 * auth.uid() to return NULL and RLS INSERT/UPDATE/DELETE policies to reject.
 *
 * @returns {Promise<{
 *   user:          import('@supabase/supabase-js').User | null,
 *   token:         string | null,
 *   supabase:      import('@supabase/supabase-js').SupabaseClient | null,
 *   errorResponse: import('next/server').NextResponse | null
 * }>}
 */
export async function requireAuth() {
  const supabase = await createClient()

  // getUser() makes a network call to Supabase to validate the JWT.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      user:          null,
      token:         null,
      supabase:      null,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      ),
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return {
    user,
    token:         session?.access_token ?? null,
    supabase,          // ← return the authenticated client for DB operations
    errorResponse: null,
  }
}
