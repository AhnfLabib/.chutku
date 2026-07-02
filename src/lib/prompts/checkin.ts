import type { Checkin, Profile } from '@/types'

function avg(values: (number | null)[]): string {
  const nums = values.filter((v): v is number => v !== null)
  if (!nums.length) return 'n/a'
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1)
}

export function buildTemplateCheckinSummary(
  checkins: Checkin[],
  profiles: Profile[]
): string {
  const byUser = Object.fromEntries(checkins.map(c => [c.user_id, c]))
  const parts = profiles
    .map(p => {
      const c = byUser[p.id]
      if (!c?.free_text?.trim()) return null
      return `${p.display_name} shared: "${c.free_text.trim()}"`
    })
    .filter(Boolean)

  const mood = avg(checkins.map(c => c.mood))
  const closeness = avg(checkins.map(c => c.closeness))

  const themes = parts.length ? parts.join(' ') : 'You both checked in today.'
  return `You both showed up today — mood averaged ${mood}/10, closeness ${closeness}/10. ${themes} Maybe take a few minutes tonight to talk about what stood out.`
}

export function buildCheckinSummaryPrompt(
  checkins: Checkin[],
  profiles: Profile[]
): string {
  const byUser = Object.fromEntries(checkins.map(c => [c.user_id, c]))
  const lines = profiles.map(p => {
    const c = byUser[p.id]
    if (!c) return `${p.display_name}: did not respond`
    return `${p.display_name}: mood=${c.mood}/10, energy=${c.energy}/10, stress=${c.stress}/10, closeness=${c.closeness}/10. "${c.free_text ?? ''}"`
  })

  return `You are .chtku, a warm and private couples assistant.

Today's check-ins:
${lines.join('\n')}

Write a 2–3 sentence summary of shared themes and one gentle conversation starter. Be warm, specific, and non-clinical. Do not repeat numbers verbatim.`
}

export function buildWeeklyRecapPrompt(
  checkins: Checkin[],
  profiles: Profile[]
): string {
  const names = profiles.map(p => p.display_name).join(' and ')
  const days = checkins.length

  const avgMood = avg(checkins.map(c => c.mood))
  const avgEnergy = avg(checkins.map(c => c.energy))
  const avgStress = avg(checkins.map(c => c.stress))
  const avgCloseness = avg(checkins.map(c => c.closeness))

  const freeTexts = checkins.map(c => c.free_text).filter(Boolean).join(' | ')

  return `You are .chtku, a private couples assistant for ${names}.

This week's check-in data (${days} responses):
- Average mood: ${avgMood}/10
- Average energy: ${avgEnergy}/10
- Average stress: ${avgStress}/10
- Average closeness: ${avgCloseness}/10
- What they shared: "${freeTexts}"

Write a warm weekly recap in 3–4 sentences covering emotional patterns, any notable themes, and one actionable suggestion for the coming week.`
}
