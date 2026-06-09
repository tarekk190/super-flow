"use server";

/**
 * SperoFlow — Data Ingestion Pipeline Server Actions.
 *
 * Orchestrates the end-to-end data flow:
 *   User submits text
 *     → Save to Supabase (source of truth, status tracking)
 *     → Send to FastAPI /api/ingest on Lightning.ai
 *       → FastAPI parses → writes to Neo4j → generates bge-m3 embeddings
 *     → Update Supabase document status
 *
 * All graph and vector operations happen inside the Lightning.ai FastAPI service.
 * Next.js only handles auth and relational/status data in Supabase.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ingestData } from '@/lib/lightning'

// ── Helper ────────────────────────────────────────────────────────────────────

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { user: null, token: null, supabase: null }
  const { data: { session } } = await supabase.auth.getSession()
  return { user, token: session?.access_token ?? null, supabase }
}

// ── Ingest Text ───────────────────────────────────────────────────────────────

/**
 * Ingest raw text through the full GraphRAG pipeline.
 *
 * Steps:
 * 1. Authenticate user via Supabase
 * 2. Save raw text to Supabase `documents` table (with status: 'processing')
 * 3. Send text to Lightning.ai FastAPI /api/ingest
 *    → FastAPI: parse → write Neo4j nodes/edges → generate bge-m3 embeddings
 * 4. Update Supabase document status to 'completed'
 *
 * @param {string} text - Raw text content to ingest
 * @param {string} [title] - Optional document title
 * @param {string} [roadmapName] - Optional roadmap identifier (default: auto-generated)
 * @returns {Promise<{success: boolean, documentId?: string, data?: object, error?: string}>}
 */
export async function ingestText(text, title, roadmapName) {
  const { user, token, supabase } = await getAuthContext()
  if (!user) return { success: false, error: 'You must be logged in to ingest data.' }

  // ── Step 1: Save to Supabase ──────────────────────────────────────────────
  const { data: document, error: insertError } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      title: title || text.substring(0, 100).trim() + '...',
      content: text,
      status: 'processing',
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[Ingest] Failed to save document:', insertError.message)
    return { success: false, error: 'Failed to save document. Please try again.' }
  }

  const documentId = document.id
  const resolvedRoadmapName = roadmapName || `doc-${documentId.slice(0, 8)}`

  try {
    // ── Step 2: Ingest into Neo4j + embed via Lightning.ai ────────────────────
    const aiResult = await ingestData({
      roadmapName: resolvedRoadmapName,
      content: text,
      sourceType: 'text',
      generateEmbeddings: true,
      token,
    })

    // ── Step 3: Update Supabase status ─────────────────────────────────────────
    await supabase
      .from('documents')
      .update({
        status: 'completed',
        entity_count: aiResult.nodes_created || 0,
        relationship_count: aiResult.edges_created || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)

    revalidatePath('/agentic-hub')

    return {
      success: true,
      documentId,
      data: {
        nodes_created: aiResult.nodes_created,
        edges_created: aiResult.edges_created,
        vectors_embedded: aiResult.vectors_embedded,
        roadmap_name: resolvedRoadmapName,
        message: aiResult.message,
      },
    }
  } catch (err) {
    console.error('[Ingest] Pipeline failed for document', documentId, ':', err.message)

    await supabase
      .from('documents')
      .update({
        status: 'failed',
        error_message: err.message.substring(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)

    return {
      success: false,
      documentId,
      error: `Ingestion failed: ${err.message}`,
    }
  }
}

// ── Ingest JSON Roadmap ───────────────────────────────────────────────────────

/**
 * Ingest a roadmap.sh JSON file into the knowledge graph.
 *
 * @param {string} jsonContent - Roadmap JSON as a string
 * @param {string} roadmapName - Unique roadmap identifier
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function ingestRoadmapJson(jsonContent, roadmapName) {
  const { user, token } = await getAuthContext()
  if (!user) return { success: false, error: 'Not authenticated.' }

  try {
    const result = await ingestData({
      roadmapName,
      content: jsonContent,
      sourceType: 'json',
      generateEmbeddings: true,
      token,
    })
    revalidatePath('/agentic-hub')
    return { success: true, data: result }
  } catch (error) {
    console.error('[Ingest] ingestRoadmapJson failed:', error.message)
    return { success: false, error: error.message }
  }
}

// ── Retry ─────────────────────────────────────────────────────────────────────

/**
 * Retry a failed document ingestion.
 *
 * @param {string} documentId - UUID of the failed document
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function retryIngestion(documentId) {
  const { user, token, supabase } = await getAuthContext()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('content, title, user_id')
    .eq('id', documentId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !doc) {
    return { success: false, error: 'Document not found or access denied.' }
  }

  await supabase
    .from('documents')
    .update({ status: 'processing', error_message: null })
    .eq('id', documentId)

  try {
    const roadmapName = `doc-${documentId.slice(0, 8)}`
    const aiResult = await ingestData({
      roadmapName,
      content: doc.content,
      sourceType: 'text',
      generateEmbeddings: true,
      token,
    })

    await supabase
      .from('documents')
      .update({
        status: 'completed',
        entity_count: aiResult.nodes_created || 0,
        relationship_count: aiResult.edges_created || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)

    revalidatePath('/agentic-hub')
    return { success: true }
  } catch (err) {
    await supabase
      .from('documents')
      .update({
        status: 'failed',
        error_message: err.message.substring(0, 500),
      })
      .eq('id', documentId)

    return { success: false, error: err.message }
  }
}

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Fetch all documents for the current user.
 *
 * @returns {Promise<{success: boolean, data?: object[], error?: string}>}
 */
export async function getDocuments() {
  const { user, supabase } = await getAuthContext()
  if (!user) return { success: false, error: 'Not authenticated.' }

  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, title, status, entity_count, relationship_count, error_message, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, data: documents }
}
