import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/route-guard';

/**
 * PATCH /api/calendar/[id]
 * Body: any subset of { title, color, role, start_time, end_time }
 */
export async function PATCH(request, { params }) {
  // Next.js 15: params is a Promise
  const { id } = await params;

  const { user, supabase, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const allowed = ['title', 'color', 'role', 'start_time', 'end_time'];
  const updates = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  updates.updated_at = new Date().toISOString();

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
  }

  // Reuse the authenticated client — same session that passed getUser()
  const { data, error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('[calendar PATCH] error:', error.code, error.message);
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  return NextResponse.json({ event: data });
}

/**
 * DELETE /api/calendar/[id]
 */
export async function DELETE(request, { params }) {
  // Next.js 15: params is a Promise
  const { id } = await params;

  const { user, supabase, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  // Reuse the authenticated client
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[calendar DELETE] error:', error.code, error.message);
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
