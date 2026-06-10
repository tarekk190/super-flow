import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/route-guard';

const LIGHTNING_API_URL = process.env.LIGHTNING_API_URL;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(request, { params }) {
  const { user, token, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: 'Invalid request body.' },
      { status: 400 }
    );
  }

  const { title, details } = body;
  if (!title) {
    return NextResponse.json(
      { success: false, data: null, error: 'title is required.' },
      { status: 400 }
    );
  }

  // ── 1. Try LIGHTNING_API_URL ───────────────────────────────────────────────
  if (LIGHTNING_API_URL) {
    try {
      const res = await fetch(`${LIGHTNING_API_URL}/api/analyze-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ task_id: id, title, details, user_id: user.id }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({
          success: true,
          data: {
            task_id: id,
            suggested_quadrant: data.suggested_quadrant || 'q2',
            reasoning: data.reasoning || data.coach_reasoning || '',
            urgency_score: data.urgency_score ?? data.urgencyScore ?? 0.5,
            importance_score: data.importance_score ?? data.importanceScore ?? 0.5,
          },
          error: null,
        });
      }
    } catch (err) {
      console.warn('[analyze] Lightning API failed, falling back to Claude:', err.message);
    }
  }

  // ── 2. Try Anthropic API via raw fetch ─────────────────────────────────────
  if (ANTHROPIC_API_KEY) {
    try {
      const prompt = `You are a productivity coach using the Eisenhower Matrix. Analyze this task and classify it.

Task: "${title}"${details ? `\nDetails: "${details}"` : ''}

Respond with a JSON object (no markdown, no code fences) with these exact fields:
{
  "suggested_quadrant": "q1" | "q2" | "q3" | "q4",
  "reasoning": "one to two sentence explanation",
  "urgency_score": 0.0 to 1.0,
  "importance_score": 0.0 to 1.0
}

Quadrant guide:
- q1: Urgent & Important (do immediately)
- q2: Not Urgent & Important (schedule it)
- q3: Urgent & Not Important (delegate it)
- q4: Not Urgent & Not Important (eliminate it)`;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-8',
          max_tokens: 512,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(30_000),
      });

      if (res.ok) {
        const aiData = await res.json();
        const text = aiData.content?.[0]?.text || '';
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch {
          const match = text.match(/\{[\s\S]*\}/);
          parsed = match ? JSON.parse(match[0]) : null;
        }
        if (parsed) {
          return NextResponse.json({
            success: true,
            data: {
              task_id: id,
              suggested_quadrant: parsed.suggested_quadrant || 'q2',
              reasoning: parsed.reasoning || '',
              urgency_score: parsed.urgency_score ?? 0.5,
              importance_score: parsed.importance_score ?? 0.5,
            },
            error: null,
          });
        }
      }
    } catch (err) {
      console.warn('[analyze] Anthropic API failed:', err.message);
    }
  }

  // ── 3. Stub fallback ───────────────────────────────────────────────────────
  return NextResponse.json({
    success: true,
    data: {
      task_id: id,
      suggested_quadrant: 'q2',
      reasoning: 'AI analysis unavailable. Defaulting to Q2 (Schedule It) as a safe starting point.',
      urgency_score: 0.4,
      importance_score: 0.6,
    },
    error: null,
  });
}
