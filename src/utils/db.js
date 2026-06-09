/**
 * DEPRECATED — SperoFlow no longer uses this file.
 *
 * This module provided a raw node-postgres (pg) connection pool that
 * connected directly to a local PostgreSQL instance via DATABASE_URL.
 * It has been fully superseded by the Supabase PostgREST client, which:
 *
 *   - Connects to Supabase Postgres via the REST API (no raw SQL)
 *   - Enforces Row Level Security automatically per authenticated user
 *   - Requires no direct database connection string in the frontend
 *   - Is accessed via import { createClient } from '@/lib/supabase/server'
 *
 * The following environment variables are no longer needed:
 *   - DATABASE_URL
 *   - JWT_SECRET
 *
 * DO NOT import this file in new code.
 */

// This file is intentionally left empty of executable code.
