/**
 * DEPRECATED — SperoFlow no longer uses this file.
 *
 * This module implemented a custom JWT authentication system using the
 * `jose` library with a `speroflow_session` cookie. It has been fully
 * superseded by Supabase Auth (@supabase/ssr), which provides:
 *
 *   - Secure HTTP-only session cookies managed automatically
 *   - Server-side JWT verification via supabase.auth.getUser()
 *   - Automatic token refresh via the Next.js middleware
 *   - Row Level Security on the database layer
 *
 * DO NOT import this file in new code.
 *
 * Auth utilities to use instead:
 *   - Server Components / Actions → import { createClient } from '@/lib/supabase/server'
 *   - Client Components           → import { useUser } from '@/hooks/useUser'
 *   - API Route Handlers          → import { requireAuth } from '@/lib/supabase/route-guard'
 *   - Browser client              → import { createClient } from '@/lib/supabase/client'
 */

// This file is intentionally left empty of executable code.
// It is kept to prevent import errors if any stale reference exists
// and to serve as a breadcrumb explaining the migration.
