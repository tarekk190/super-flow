import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/route-guard';

const BACKEND_URL = process.env.LIGHTNING_SERVICE_URL || 'http://localhost:8000';

/**
 * POST /api/brain
 *
 * Authenticated proxy to the FastAPI Central Brain Orchestrator.
 * Validates the Supabase session server-side before forwarding.
 * Passes the Supabase access token to the backend so it can
 * verify the user's identity independently.
 *
 * Returns 401 if the request has no valid Supabase session.
 */
export async function POST(request) {
  // Validate session — getUser() makes a server-side roundtrip to Supabase.
  // Never read the raw 'sb-*' cookie directly; the cookie name is an
  // implementation detail of @supabase/ssr and changes with project ref.
  const { user, token, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/brain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...body, user_id: user.id }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[BrainProxy] Error:', err);
    return NextResponse.json(
      { error: 'Failed to reach the Brain Orchestrator. Is the backend running?' },
      { status: 503 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'central-brain' });
}
