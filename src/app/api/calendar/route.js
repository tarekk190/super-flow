import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/route-guard';

/**
 * GET /api/calendar?start=ISO&end=ISO
 */
export async function GET(request) {
  const { user, supabase, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end   = searchParams.get('end');

  // Reuse the same authenticated client — no second createClient() call
  let query = supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', user.id)
    .order('start_time', { ascending: true });

  if (start) query = query.gte('start_time', start);
  if (end)   query = query.lte('start_time', end);

  const { data, error } = await query;

  if (error) {
    console.error('[calendar GET] error:', error.code, error.message);
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.warn('[calendar] Table not found — run the SQL schema in Supabase SQL Editor.');
      return NextResponse.json({ events: [] });
    }
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }

  return NextResponse.json({ events: data ?? [] });
}

/**
 * POST /api/calendar
 * Body: { title, color, role, start_time, end_time }
 */
export async function POST(request) {
  const { user, supabase, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, color, role, start_time, end_time } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }
  if (!start_time || !end_time) {
    return NextResponse.json({ error: 'start_time and end_time are required' }, { status: 400 });
  }

  const payload = {
    user_id:    user.id,
    title:      title.trim(),
    color:      color || 'indigo',
    role:       role  || '',
    start_time,
    end_time,
  };

  // Diagnostic — visible in the Next.js dev server terminal
  console.log('[calendar POST] user.id  :', user.id);
  console.log('[calendar POST] payload  :', JSON.stringify(payload));

  // Reuse the same authenticated client — prevents stale-cookie RLS failure
  const { data, error } = await supabase
    .from('calendar_events')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('[calendar POST] Supabase error — code:', error.code, '| message:', error.message);
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Table "calendar_events" not found. Run the SQL schema in Supabase SQL Editor.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }

  console.log('[calendar POST] created  :', data.id);
  return NextResponse.json({ event: data }, { status: 201 });
}
