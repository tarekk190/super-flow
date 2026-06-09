'use server';

/**
 * SperoFlow — Task Server Actions (Supabase Integration).
 *
 * CRUD operations for the Eisenhower Matrix tasks. Migrated from
 * raw PostgreSQL (`pg` + SQL) to Supabase PostgREST client.
 *
 * Row Level Security (RLS) on the `tasks` table ensures users
 * can only access their own tasks — no manual user_id filtering needed
 * in most queries, but we include it for defense-in-depth.
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Get the authenticated user or throw.
 * Uses Supabase's `getUser()` which validates the token server-side.
 */
async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return { supabase, user };
}

/**
 * Fetch all tasks for the current user.
 */
export async function fetchTasks() {
  const { supabase, user } = await requireUser();

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Tasks] Fetch failed:', error.message);
    throw new Error('Failed to fetch tasks.');
  }

  // Map 'description' back to 'desc' for the frontend
  return tasks.map(task => ({
    ...task,
    desc: task.description,
  }));
}

/**
 * Create a new task.
 */
export async function createTask(taskData) {
  const { supabase, user } = await requireUser();

  const { title, desc, tag, due, quadrant_id, aiSorted, aiLabel } = taskData;

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title,
      description: desc || null,
      tag: tag || null,
      due: due || null,
      quadrant_id: quadrant_id || 'unsorted',
      ai_sorted: aiSorted || false,
      ai_label: aiLabel || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[Tasks] Create failed:', error.message);
    throw new Error('Failed to create task.');
  }

  revalidatePath('/matrix');
  return { ...task, desc: task.description };
}

/**
 * Update the quadrant of an existing task.
 */
export async function updateTaskQuadrant(taskId, newQuadrantId) {
  const { supabase, user } = await requireUser();

  const { data: task, error } = await supabase
    .from('tasks')
    .update({
      quadrant_id: newQuadrantId,
      ai_sorted: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('[Tasks] Update failed:', error.message);
    throw new Error('Task not found or access denied.');
  }

  revalidatePath('/matrix');
  return { ...task, desc: task.description };
}

/**
 * Delete a task.
 */
export async function deleteTask(taskId) {
  const { supabase, user } = await requireUser();

  const { error, count } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', user.id);

  if (error) {
    console.error('[Tasks] Delete failed:', error.message);
    throw new Error('Task not found or access denied.');
  }

  revalidatePath('/matrix');
  return true;
}
