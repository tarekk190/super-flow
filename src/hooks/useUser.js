'use client'

/**
 * SperoFlow — useUser hook.
 *
 * Returns the currently authenticated Supabase user from the browser
 * session. Subscribes to `onAuthStateChange` so the component
 * re-renders automatically on sign-in, sign-out, or token refresh.
 *
 * Usage:
 *   import { useUser } from '@/hooks/useUser'
 *
 *   function MyComponent() {
 *     const { user, loading } = useUser()
 *     if (loading) return <Spinner />
 *     if (!user) return <p>Not signed in</p>
 *     return <p>Hello, {user.email}</p>
 *   }
 *
 * Notes:
 *   - For Server Components / Server Actions, use `createClient()` from
 *     `@/lib/supabase/server` and call `supabase.auth.getUser()` directly.
 *   - This hook is for Client Components only (state, event handlers).
 *   - `loading` is true only during the initial session check. After that
 *     it stays false even if `user` changes due to auth events.
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * @typedef {Object} UseUserResult
 * @property {import('@supabase/supabase-js').User | null} user - The authenticated user, or null
 * @property {boolean} loading - True only during the initial async session fetch
 */

/**
 * @returns {UseUserResult}
 */
export function useUser() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Fetch the current session on mount.
    // `getUser()` validates with Supabase server — safer than `getSession()`.
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null)
      setLoading(false)
    })

    // Subscribe to auth events: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}
