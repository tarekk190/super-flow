'use server'

/**
 * SperoFlow — Authentication Server Actions (Supabase Auth).
 *
 * Handles user signup, login, and logout using Supabase Auth
 * with email/password authentication. Replaces the previous
 * custom JWT + bcryptjs + raw SQL implementation.
 *
 * Supabase handles:
 * - Password hashing (bcrypt internally)
 * - Session token creation and refresh
 * - Secure HTTP-only cookie management (via @supabase/ssr)
 */

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Sign up a new user using email and password.
 *
 * Supabase automatically hashes the password, creates the user in
 * `auth.users`, generates a session token, and sets the cookie.
 *
 * @param {object} data - Object containing email and password
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function signup(data) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (error) {
      console.error('[Auth] Signup failed:', error.message)

      // Map Supabase error codes to user-friendly messages
      if (error.message.includes('already registered')) {
        return { success: false, error: 'An account with this email already exists.' }
      }
      if (error.message.includes('password')) {
        return { success: false, error: 'Password must be at least 6 characters.' }
      }

      return { success: false, error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    console.error('[Auth] Signup unexpected error:', err)
    return { success: false, error: 'Failed to create account. Please try again.' }
  }
}

/**
 * Log in a user using email and password.
 *
 * Supabase verifies the credentials, creates a new session,
 * and sets the HTTP-only cookie via the SSR middleware.
 *
 * @param {object} data - Object containing email and password
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function login(data) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      console.error('[Auth] Login failed:', error.message)
      return { success: false, error: 'Invalid email or password.' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err) {
    console.error('[Auth] Login unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Log out the currently authenticated user.
 * Clears the session cookie and redirects to /login.
 */
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * Get the currently authenticated user.
 *
 * Uses `getUser()` which makes a round-trip to Supabase to
 * validate the token — safer than `getSession()` which only
 * reads from the cookie.
 *
 * @returns {Promise<{id: string, email: string} | null>}
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) return null

    return { id: user.id, email: user.email }
  } catch {
    return null
  }
}
