import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/route-guard';

/**
 * GET /api/tasks
 * Returns all tasks for the authenticated user, newest first.
 */
export async function GET() {
  const { user, supabase, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[tasks GET] error:', error.code, error.message);
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.warn('[tasks] Table not found — run the SQL schema in Supabase SQL Editor.');
      return NextResponse.json({ tasks: [] });
    }
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }

  return NextResponse.json({ tasks: data ?? [] });
}

/**
 * POST /api/tasks
 * Body: { title, description?, priority?, tags? }
 * Always creates with status = "todo".
 */
export async function POST(request) {
  const { user, supabase, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, description, priority, tags } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  const payload = {
    user_id:     user.id,
    title:       title.trim(),
    description: description?.trim() || '',
    status:      'todo',
    priority:    priority || 'Med',
    tags:        Array.isArray(tags) ? tags : [],
  };

  console.log('[tasks POST] user.id :', user.id);
  console.log('[tasks POST] payload :', JSON.stringify(payload));

  const { data, error } = await supabase
    .from('tasks')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('[tasks POST] error:', error.code, error.message);
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Table "tasks" not found. Run the SQL schema in Supabase SQL Editor.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }

  console.log('[tasks POST] created :', data.id);
  return NextResponse.json({ task: data }, { status: 201 });
}
