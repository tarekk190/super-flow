import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/route-guard';

const LIGHTNING_API_URL = process.env.LIGHTNING_API_URL;
const LIGHTNING_API_KEY = process.env.LIGHTNING_API_KEY;

/**
 * POST /api/matrix-sort
 *
 * Authenticated proxy to the SperoFlow Smart Scheduler (FastAPI backend).
 * Returns 401 for unauthenticated requests.
 *
 * The `userId` previously read from the request body was a security hole —
 * any client could supply an arbitrary user ID. We now use the server-
 * validated `user.id` from the Supabase session exclusively.
 *
 * Forwards task descriptions to the Anti-Burnout Engine which:
 *   1. Classifies via Eisenhower ML model
 *   2. Gathers user context (emotion, calendar, roadmap)
 *   3. Uses LLM to determine/override quadrant placement
 *
 * Falls back to a local stub if the backend is not configured.
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

  const { tasks } = body;
  // userId from body is intentionally ignored — use server-validated identity
  const userId = user.id;

  if (!tasks?.length) {
    return NextResponse.json({ error: 'No tasks provided.' }, { status: 400 });
  }

  // If backend is not configured, return a stub response
  if (!LIGHTNING_API_URL) {
    console.warn('[matrix-sort] LIGHTNING_API_URL not set — using stub response.');
    return NextResponse.json({
      classifications: tasks.map((t) => ({
        taskId: t.id,
        quadrant: 'q2',
        confidence: 0.85,
        suggested_time_block: null,
        coach_reasoning: 'Backend not configured. Using default classification.',
        priority_override: null,
      })),
    });
  }

  const headers = {
    'Content-Type': 'application/json',
    // Prefer the Supabase session token so the backend can verify the user.
    // Fall back to the service API key if no user token is available.
    Authorization: token
      ? `Bearer ${token}`
      : LIGHTNING_API_KEY
      ? `Bearer ${LIGHTNING_API_KEY}`
      : '',
  };

  try {
    const classifications = await Promise.all(
      tasks.map(async (task) => {
        try {
          const res = await fetch(`${LIGHTNING_API_URL}/api/smart-schedule`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              task_description: task.title || task.description || task.text || String(task.id),
              user_id: userId,
            }),
            signal: AbortSignal.timeout(120_000),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.error(`[matrix-sort] Backend error for task ${task.id}:`, err);
            return {
              taskId: task.id,
              quadrant: 'q2',
              confidence: 0.0,
              suggested_time_block: null,
              coach_reasoning: `Backend error: ${err.detail || res.status}`,
              priority_override: null,
            };
          }

          const data = await res.json();
          return {
            taskId: task.id,
            quadrant: data.adjusted_quadrant || 'q2',
            originalQuadrant: data.eisenhower?.original_quadrant || null,
            confidence: data.eisenhower?.model_confidence || 0.0,
            urgencyScore: data.eisenhower?.urgency_score || 0.0,
            importanceScore: data.eisenhower?.importance_score || 0.0,
            suggested_time_block: data.suggested_time_block || null,
            coach_reasoning: data.coach_reasoning || '',
            priority_override: data.priority_override || null,
            emotion_summary: data.emotion_summary || '',
          };
        } catch (taskErr) {
          console.error(`[matrix-sort] Failed for task ${task.id}:`, taskErr.message);
          return {
            taskId: task.id,
            quadrant: 'q2',
            confidence: 0.0,
            suggested_time_block: null,
            coach_reasoning: 'Classification failed — please retry.',
            priority_override: null,
          };
        }
      })
    );

    return NextResponse.json({ classifications });
  } catch (err) {
    console.error('[matrix-sort] Batch classification failed:', err);
    return NextResponse.json(
      { error: `Classification failed: ${err.message}` },
      { status: 502 }
    );
  }
}
