const ALLOWED_TAGS = ['event', 'favorite', 'gift_idea', 'story', 'place', 'future_plan', 'reminder']

export function buildMemorySuggestionPrompt(
  freeText: string,
  displayName: string,
  existingTitles: string[]
): string {
  const titlesSection = existingTitles.length
    ? `Already saved memory titles (skip anything already covered):\n${existingTitles.map(t => `- ${t}`).join('\n')}`
    : 'No memories saved yet.'

  return `You are .chtku, a private couples assistant.

${displayName} shared this in today's check-in:
"${freeText}"

${titlesSection}

Extract 0–2 durable "shared memory" candidates worth remembering long-term — such as events, favorites, gift ideas, places, future plans, or reminders. Do NOT extract transient moods, complaints, or generic feelings.

Return a JSON array only. Each item: { "title": string, "content": string, "tags": string[] }
Tags must be chosen from: ${ALLOWED_TAGS.join(', ')}.
If nothing is worth saving, return [].
No text outside the JSON array.`
}

export { ALLOWED_TAGS as MEMORY_SUGGESTION_ALLOWED_TAGS }
