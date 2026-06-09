/**
 * SperoFlow — Supabase Middleware Session Helper.
 *
 * Refreshes the user's session on every request by reading the
 * session cookie, calling Supabase to validate/refresh it, and
 * writing the updated cookie back. This MUST run before any
 * Server Component that calls `supabase.auth.getUser()`.
 *
 * This module is imported by the root `middleware.js`.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

/**
 * Refresh the Supabase session and update cookies on the response.
 *
 * @param {import('next/server').NextRequest} request
 * @returns {Promise<import('next/server').NextResponse>}
 */
export async function updateSession(request) {
  // Start with a plain "next" response that passes the request through
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Set cookies on the request (for downstream Server Components)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )

          // Create a fresh response that carries the updated cookies
          supabaseResponse = NextResponse.next({ request })

          // Set cookies on the response (for the browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do NOT use `getSession()` here — it reads from cookies
  // and can be spoofed. `getUser()` makes a round-trip to Supabase
  // to validate the token, which is the secure approach.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If there's no authenticated user and they're trying to access
  // a protected route, redirect to /login
  const isProtectedRoute =
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/signup') &&
    !request.nextUrl.pathname.startsWith('/auth')

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
