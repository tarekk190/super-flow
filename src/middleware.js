/**
 * SperoFlow — Next.js Middleware.
 *
 * Runs on every matched request to refresh the Supabase session.
 * This ensures that Server Components always have access to a
 * valid, up-to-date session when calling `supabase.auth.getUser()`.
 *
 * Replaces the previous custom JWT verification middleware.
 */

import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (browser icon)
     * - Public assets (images, SVGs, etc.)
     *
     * This ensures the middleware only runs on page navigations
     * and API routes, not on static asset requests.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
