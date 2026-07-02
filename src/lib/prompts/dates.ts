import { formatMemoriesForPrompt } from '../ai'
import type { Memory, Profile } from '@/types'

type Ctx = { profiles: Profile[]; memories: Memory[] }

export function buildDateGenerationPrompt(
  ctx: Ctx,
  filters: { category?: string; budget?: string; duration?: string }
): string {
  const names = ctx.profiles.map(p => p.display_name).join(' and ')
  const memorySummary = formatMemoriesForPrompt(ctx.memories)

  return `You are .chtku, a private assistant for ${names}.

Shared memories and preferences:
${memorySummary}

Generate exactly 3 to 5 date ideas. Apply these filters:
- Category: ${filters.category ?? 'any'}
- Budget: ${filters.budget ?? 'any'}
- Duration: ${filters.duration ?? 'any'}

For each idea return a JSON object with:
{ "title": string, "description": string, "category": string, "estimated_cost": "$" | "$$" | "$$$" | "free", "duration": "quick" | "half-day" | "full-day", "why": string }

"why" should reference something from shared memories when relevant.
Return a JSON array only — no explanation outside the array.`
}
