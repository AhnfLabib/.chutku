import { createClient } from '@/lib/supabase/server'
import type { Memory, Profile } from '@/types'

const DEFAULT_BASE_URL = 'http://127.0.0.1:11434'
const DEFAULT_MODEL = 'llama3.2:3b'

function ollamaConfig() {
  return {
    baseUrl: process.env.OLLAMA_BASE_URL ?? DEFAULT_BASE_URL,
    model: process.env.OLLAMA_MODEL ?? DEFAULT_MODEL,
  }
}

/** Call a local Ollama model. Returns empty string if Ollama is unreachable. */
export async function complete(prompt: string, maxTokens = 300): Promise<string> {
  const { baseUrl, model } = ollamaConfig()

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: { num_predict: maxTokens },
      }),
      signal: AbortSignal.timeout(90_000),
    })

    if (!res.ok) return ''

    const data = (await res.json()) as { message?: { content?: string } }
    return data.message?.content?.trim() ?? ''
  } catch {
    return ''
  }
}

export async function embedText(text: string): Promise<number[]> {
  // Local embeddings via Ollama (e.g. nomic-embed-text) can be added later.
  // Until then, semantic search falls back to recency ordering.
  void text
  return []
}

export interface CoupleContext {
  profiles: Profile[]
  memories: Memory[]
}

// Single choke-point for AI context: private_memories NEVER appear here.
export async function buildCoupleContext(
  workspaceId: string,
  queryText?: string
): Promise<CoupleContext> {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('workspace_id', workspaceId)

  let memories: Memory[] = []

  if (queryText) {
    const embedding = await embedText(queryText)
    if (embedding.length > 0) {
      const { data } = await supabase.rpc('search_memories', {
        query_embedding: embedding,
        workspace_id_input: workspaceId,
        match_count: 5,
      })
      memories = data ?? []
    } else {
      const { data } = await supabase
        .from('memories')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('confirmed', true)
        .order('created_at', { ascending: false })
        .limit(10)
      memories = data ?? []
    }
  } else {
    const { data } = await supabase
      .from('memories')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('confirmed', true)
      .order('created_at', { ascending: false })
      .limit(10)
    memories = data ?? []
  }

  return { profiles: profiles ?? [], memories }
}

export function formatMemoriesForPrompt(memories: Memory[]): string {
  if (!memories.length) return 'No shared memories stored yet.'
  return memories
    .map(m => `[${m.tags.join(', ')}] ${m.title}: ${m.content}`)
    .join('\n')
}
