"use server";

/**
 * SperoFlow — AI Server Actions.
 *
 * Secure bridge between Next.js and the SperoFlow FastAPI service on Lightning.ai.
 * All graph/vector/LLM operations are delegated to the FastAPI service.
 * Next.js only handles auth (Supabase) and relational data.
 */

import { createClient } from '@/lib/supabase/server'
import {
  queryKnowledgeGraph,
  generateLearningPath,
  embedJournalEntry as lightningEmbedJournal,
  searchJournalEntries as lightningSearchJournal,
} from '@/lib/lightning'

// ── Helper: get authenticated user + session token ────────────────────────────

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { user: null, token: null }

  const { data: { session } } = await supabase.auth.getSession()
  return { user, token: session?.access_token ?? null }
}

// ── Query ─────────────────────────────────────────────────────────────────────

/**
 * Query the knowledge graph with a natural language question.
 * Delegates to the FastAPI /api/query endpoint on Lightning.ai.
 *
 * @param {string} question - Natural language question
 * @param {'vector'|'cypher'|'hybrid'} [strategy='hybrid']
 * @param {number|null} [topK]
 * @returns {Promise<{success, data?, error?}>}
 */
export async function queryGraph(question, strategy = 'hybrid', topK = null) {
  try {
    const { user, token } = await getAuthContext()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const result = await queryKnowledgeGraph({ question, strategy, topK, token })
    return { success: true, data: result }
  } catch (error) {
    console.error('[AI Action] queryGraph failed:', error.message)
    return { success: false, error: error.message }
  }
}

// ── Roadmap ───────────────────────────────────────────────────────────────────

/**
 * Generate a prerequisite learning path for a goal topic.
 * Delegates to the FastAPI /api/roadmap/prerequisites endpoint.
 *
 * @param {string} goalName - Target topic (must exist in Neo4j graph)
 * @returns {Promise<{success, data?, error?}>}
 */
export async function getPrerequisitePath(goalName) {
  try {
    const { user, token } = await getAuthContext()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const result = await generateLearningPath({ goalName, token })
    return { success: true, data: result }
  } catch (error) {
    console.error('[AI Action] getPrerequisitePath failed:', error.message)
    // Surface 404 as a friendly message
    if (error.message.includes('404') || error.message.includes('not found')) {
      return {
        success: false,
        error: `Topic "${goalName}" not found in the knowledge graph. Check the spelling or try a different topic.`,
      }
    }
    return { success: false, error: error.message }
  }
}

// ── Journal ───────────────────────────────────────────────────────────────────

/**
 * Embed and store a journal entry in Neo4j via Lightning.ai.
 * Also saves the raw text to Supabase for persistence and querying.
 *
 * @param {string} content - Journal entry text
 * @returns {Promise<{success, data?, error?}>}
 */
export async function embedJournalEntry(content) {
  try {
    const { user, token } = await getAuthContext()
    if (!user) return { success: false, error: 'Not authenticated.' }

    // Save raw text to Supabase (source of truth for journal entries)
    const supabase = await createClient()
    const { data: entry, error: dbError } = await supabase
      .from('journal_entries')
      .insert({ user_id: user.id, content })
      .select('id')
      .single()

    if (dbError) {
      console.warn('[AI Action] Supabase journal insert failed (non-fatal):', dbError.message)
    }

    // Generate embedding + store vector in Neo4j via FastAPI
    const result = await lightningEmbedJournal({
      userId: user.id,
      content,
      token,
    })

    return {
      success: true,
      data: {
        entry_id: result.entry_id,
        supabase_id: entry?.id ?? null,
      },
    }
  } catch (error) {
    console.error('[AI Action] embedJournalEntry failed:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Search past journal entries by semantic similarity.
 * Delegates vector search to the FastAPI /api/journal/search endpoint.
 *
 * @param {string} query - Search query text
 * @param {number} [topK=3] - Number of results
 * @returns {Promise<{success, data?, error?}>}
 */
export async function searchJournal(query, topK = 3) {
  try {
    const { user, token } = await getAuthContext()
    if (!user) return { success: false, error: 'Not authenticated.' }

    const result = await lightningSearchJournal({
      userId: user.id,
      query,
      topK,
      token,
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('[AI Action] searchJournal failed:', error.message)
    return { success: false, error: error.message }
  }
}
