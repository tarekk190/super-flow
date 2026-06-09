import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/route-guard';

/**
 * PATCH /api/tasks/[id]
 * Body: any subset of { title, description, status, priority, tags }
 */
export async function PATCH(request, { params }) {
  const { id } = await params;

  const { user, supabase, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const allowed = ['title', 'description', 'status', 'priority', 'tags'];
  const updates = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('[tasks PATCH] error:', error.code, error.message);
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json({ task: data });
}

/**
 * DELETE /api/tasks/[id]
 */
export async function DELETE(request, { params }) {
  const { id } = await params;

  const { user, supabase, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[tasks DELETE] error:', error.code, error.message);
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
