import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/route-guard';

const BACKEND_URL = process.env.LIGHTNING_SERVICE_URL || 'http://localhost:8000';

/**
 * POST /api/brain/resume
 *
 * Authenticated proxy to the FastAPI Brain HITL resume endpoint.
 * Called when the user approves or rejects a pending subagent action.
 *
 * Returns 401 if the request has no valid Supabase session.
 */
export async function POST(request) {
  const { user, token, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/brain/resume`, {
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
    console.error('[BrainResumeProxy] Error:', err);
    return NextResponse.json({ error: 'Failed to resume Brain workflow.' }, { status: 503 });
  }
}
