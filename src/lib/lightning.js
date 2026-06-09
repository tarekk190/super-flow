/**
 * SperoFlow — Lightning.ai FastAPI Client.
 *
 * Communicates with the SperoFlow AI Service deployed on Lightning.ai.
 * All graph, vector, and LLM operations are handled server-side.
 *
 * Endpoints:
 *   POST /api/ingest                   — Roadmap data → Neo4j graph + vectors
 *   POST /api/query                    — Hybrid RAG chat (vector + Cypher + LLM)
 *   POST /api/roadmap/prerequisites    — Learning path generation
 *   POST /api/journal/embed            — Store journal entry as vector
 *   POST /api/journal/search           — Semantic search of journal entries
 *   GET  /health                       — Service health check
 */

const LIGHTNING_API_URL = process.env.LIGHTNING_API_URL
const LIGHTNING_API_KEY = process.env.LIGHTNING_API_KEY

const MAX_RETRIES = 3
const RETRY_BASE_DELAY_MS = 1000
const REQUEST_TIMEOUT_MS = 120_000 // 2 min — embedding models can be slow

/**
 * Internal HTTP helper with exponential-backoff retry logic.
 * Attaches the Supabase session token as a Bearer token so the FastAPI
 * service can verify the user's identity.
 *
 * @param {string} path - API path (e.g. '/api/query')
 * @param {object} body - Request body (will be JSON-serialized)
 * @param {string|null} [token] - Supabase JWT access token
 * @returns {Promise<object>} Parsed JSON response
 */
async function callApi(path, body, token = null) {
  if (!LIGHTNING_API_URL) {
    throw new Error(
      'LIGHTNING_API_URL is not configured. ' +
        'Set it in .env.local to point to your Lightning.ai service.'
    )
  }

  const url = `${LIGHTNING_API_URL}${path}`
  const headers = { 'Content-Type': 'application/json' }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  } else if (LIGHTNING_API_KEY) {
    headers['Authorization'] = `Bearer ${LIGHTNING_API_KEY}`
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
        cache: 'no-store',
      })

      clearTimeout(timeoutId)

      // Non-retryable client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        const error = await response.json().catch(() => ({}))
        throw new Error(
          `SperoFlow AI API error ${response.status}: ${error.detail || error.message || 'Unknown error'}`
        )
      }

      if (!response.ok) {
        throw new Error(`SperoFlow AI server error: ${response.status}`)
      }

      return await response.json()
    } catch (err) {
      const isLastAttempt = attempt === MAX_RETRIES - 1
      if (err.name === 'AbortError') {
        throw new Error(
          `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. The AI service may be loading.`
        )
      }
      if (err.message.includes('API error 4')) throw err
      if (isLastAttempt) {
        throw new Error(`SperoFlow AI unreachable after ${MAX_RETRIES} attempts: ${err.message}`)
      }
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt)
      console.warn(`[Lightning] Attempt ${attempt + 1}/${MAX_RETRIES} failed, retrying in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

/**
 * Health check — verify the Lightning.ai service is running.
 * @returns {Promise<{status: string, neo4j: string}>}
 */
export async function checkHealth() {
  const response = await fetch(`${LIGHTNING_API_URL}/health`, { cache: 'no-store' })
  return response.json()
}

// ── Ingestion ─────────────────────────────────────────────────────────────────

/**
 * Ingest roadmap data into Neo4j Aura (graph nodes + edges + vector embeddings).
 *
 * @param {object} params
 * @param {string} params.roadmapName - Unique roadmap identifier
 * @param {string} params.content - Raw text or JSON string
 * @param {'text'|'json'} [params.sourceType='text'] - Content type
 * @param {boolean} [params.generateEmbeddings=true] - Auto-embed after ingest
 * @param {string|null} [params.token] - Supabase JWT
 * @returns {Promise<{roadmap_name, nodes_created, edges_created, vectors_embedded, message}>}
 */
export async function ingestData({ roadmapName, content, sourceType = 'text', generateEmbeddings = true, token = null }) {
  if (!roadmapName || !content) throw new Error('roadmapName and content are required.')
  return callApi('/api/ingest', {
    roadmap_name: roadmapName,
    content,
    source_type: sourceType,
    generate_embeddings: generateEmbeddings,
  }, token)
}

// ── Query ─────────────────────────────────────────────────────────────────────

/**
 * Query the knowledge graph with a natural language question.
 *
 * @param {object} params
 * @param {string} params.question - Natural language question
 * @param {'vector'|'cypher'|'hybrid'} [params.strategy='hybrid'] - Retrieval strategy
 * @param {number|null} [params.topK] - Override default top-k for vector search
 * @param {string|null} [params.token] - Supabase JWT
 * @returns {Promise<{answer, strategy_used, sources, vector_matches, generated_cypher}>}
 */
export async function queryKnowledgeGraph({ question, strategy = 'hybrid', topK = null, token = null }) {
  if (!question?.trim()) throw new Error('question is required.')
  return callApi('/api/query', {
    question: question.trim(),
    strategy,
    top_k: topK,
  }, token)
}

// ── Roadmap ───────────────────────────────────────────────────────────────────

/**
 * Generate a prerequisite learning path for a goal topic.
 *
 * @param {object} params
 * @param {string} params.goalName - Target topic (must exist in the graph)
 * @param {string|null} [params.token] - Supabase JWT
 * @returns {Promise<{goal, steps, total_estimated_hours, motivational_summary}>}
 */
export async function generateLearningPath({ goalName, token = null }) {
  if (!goalName?.trim()) throw new Error('goalName is required.')
  return callApi('/api/roadmap/prerequisites', { goal_name: goalName.trim() }, token)
}

// ── Journal ───────────────────────────────────────────────────────────────────

/**
 * Store a journal entry as a vector embedding in Neo4j.
 *
 * @param {object} params
 * @param {string} params.userId - Supabase user UUID
 * @param {string} params.content - Journal entry text
 * @param {string|null} [params.token] - Supabase JWT
 * @returns {Promise<{entry_id, message}>}
 */
export async function embedJournalEntry({ userId, content, token = null }) {
  if (!userId || !content?.trim()) throw new Error('userId and content are required.')
  return callApi('/api/journal/embed', { user_id: userId, content: content.trim() }, token)
}

/**
 * Search past journal entries by semantic similarity.
 *
 * @param {object} params
 * @param {string} params.userId - Supabase user UUID
 * @param {string} params.query - Search query
 * @param {number} [params.topK=3] - Number of results
 * @param {string|null} [params.token] - Supabase JWT
 * @returns {Promise<{query, matches, total_matches}>}
 */
export async function searchJournalEntries({ userId, query, topK = 3, token = null }) {
  if (!userId || !query?.trim()) throw new Error('userId and query are required.')
  return callApi('/api/journal/search', {
    user_id: userId,
    query: query.trim(),
    top_k: topK,
  }, token)
}

// ── Smart Scheduler ───────────────────────────────────────────────────────────

/**
 * Schedule a task using the Anti-Burnout Smart Scheduler.
 *
 * The backend classifies the task via the Eisenhower Matrix ML model,
 * gathers user context (emotion, calendar, roadmap), and uses LangChain/LLM
 * to suggest an optimal schedule. The subagent can override the initial
 * quadrant classification based on burnout and well-being signals.
 *
 * @param {object} params
 * @param {string} params.taskDescription - Free-text task to schedule
 * @param {string} params.userId - Supabase user UUID
 * @param {string|null} [params.token] - Supabase JWT
 * @returns {Promise<{
 *   task_description: string,
 *   eisenhower: { original_quadrant, urgency_score, importance_score, model_confidence },
 *   adjusted_quadrant: string,
 *   adjusted_quadrant_label: string,
 *   suggested_time_block: string,
 *   coach_reasoning: string,
 *   priority_override: { was_overridden, original_quadrant, adjusted_quadrant, reason },
 *   emotion_summary: string,
 *   active_topics: string[]
 * }>}
 */
export async function smartScheduleTask({ taskDescription, userId, token = null }) {
  if (!taskDescription?.trim()) throw new Error('taskDescription is required.')
  if (!userId) throw new Error('userId is required.')
  return callApi('/api/smart-schedule', {
    task_description: taskDescription.trim(),
    user_id: userId,
  }, token)
}

