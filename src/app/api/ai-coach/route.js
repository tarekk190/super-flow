import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/route-guard';

/**
 * POST /api/ai-coach
 *
 * Authenticated proxy/backend route for the Journaling AI Coach.
 * Returns 401 for unauthenticated requests.
 *
 * TODO: Replace the stub response with a call to your AI backend
 *       (e.g. OpenAI, Anthropic, or the FastAPI service on Lightning.ai).
 */
export async function POST(request) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // TODO: Forward to AI provider with user context
  // Example: await callFastApi('/api/journal/coach', { ...body, user_id: user.id }, token)
  return NextResponse.json({
    userId: user.id,
    sentiment: 'neutral',
    advice: 'AI Coach stub — wire up to your AI backend.',
  });
}

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'ai-coach' });
}
