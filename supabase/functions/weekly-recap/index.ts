import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

function avg(values: (number | null)[]): string {
  const nums = values.filter((v): v is number => v !== null)
  if (!nums.length) return 'n/a'
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1)
}

function templateRecap(
  names: string,
  checkins: { mood: number | null; energy: number | null; stress: number | null; closeness: number | null; free_text: string | null }[]
): string {
  const mood = avg(checkins.map(c => c.mood))
  const energy = avg(checkins.map(c => c.energy))
  const stress = avg(checkins.map(c => c.stress))
  const closeness = avg(checkins.map(c => c.closeness))
  const shared = checkins.map(c => c.free_text).filter(Boolean).slice(0, 2).join(' ')
  const sharedLine = shared ? ` Highlights: "${shared}"` : ''
  return `This week ${names} checked in ${checkins.length} times — mood ${mood}/10, energy ${energy}/10, stress ${stress}/10, closeness ${closeness}/10.${sharedLine} Carve out a little unhurried time together this weekend.`
}

async function ollamaComplete(prompt: string): Promise<string> {
  const baseUrl = Deno.env.get('OLLAMA_BASE_URL')
  const model = Deno.env.get('OLLAMA_MODEL') ?? 'llama3.2'
  if (!baseUrl) return ''

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: { num_predict: 300 },
      }),
    })
    if (!res.ok) return ''
    const data = await res.json()
    return data.message?.content?.trim() ?? ''
  } catch {
    return ''
  }
}

Deno.serve(async () => {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]

  const { data: workspaces } = await supabase.from('workspaces').select('id')
  if (!workspaces?.length) return new Response('No workspaces', { status: 200 })

  for (const workspace of workspaces) {
    const { data: checkins } = await supabase
      .from('checkins')
      .select('*')
      .eq('workspace_id', workspace.id)
      .gte('checkin_date', weekAgo)
      .lte('checkin_date', today)

    if (!checkins || checkins.length < 3) continue

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('workspace_id', workspace.id)

    const names = profiles?.map((p: { display_name: string }) => p.display_name).join(' and ') ?? 'You two'
    const freeTexts = checkins.map((c: { free_text: string | null }) => c.free_text).filter(Boolean).join(' | ')
    const avgMood = avg(checkins.map((c: { mood: number | null }) => c.mood))
    const avgEnergy = avg(checkins.map((c: { energy: number | null }) => c.energy))
    const avgStress = avg(checkins.map((c: { stress: number | null }) => c.stress))
    const avgCloseness = avg(checkins.map((c: { closeness: number | null }) => c.closeness))

    const prompt = `You are .chtku for ${names}. This week (${checkins.length} responses): mood=${avgMood}/10, energy=${avgEnergy}/10, stress=${avgStress}/10, closeness=${avgCloseness}/10. Shared: "${freeTexts}". Write a warm 3-sentence weekly recap with one actionable suggestion.`

    const summaryText =
      (await ollamaComplete(prompt)) || templateRecap(names, checkins)

    await supabase.from('checkin_summaries').upsert({
      workspace_id: workspace.id,
      checkin_date: today,
      summary_text: summaryText,
    })

    await new Promise(r => setTimeout(r, 1000))
  }

  return new Response('Weekly recaps generated', { status: 200 })
})
