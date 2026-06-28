import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { Memory, Profile } from '@/types'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function embedText(text: string): Promise<number[]> {
  // Anthropic doesn't have a dedicated embeddings endpoint yet.
  // Using a short Claude call to generate a deterministic float vector
  // is not practical — instead we store null and skip semantic search
  // until pgvector + an embeddings provider (e.g. OpenAI text-embedding-3-small)
  // is wired up. Returning empty array signals "no embedding available".
  // TODO: swap in real embeddings provider before launch.
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
    // Semantic search — falls back to recency when embeddings are unavailable
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
