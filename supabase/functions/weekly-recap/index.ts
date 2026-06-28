import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.20'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

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
    const avg = (arr: (number | null)[]) => {
      const nums = arr.filter((v): v is number => v !== null)
      return nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : 'n/a'
    }

    const prompt = `You are .chtku for ${names}. This week (${checkins.length} responses): mood=${avg(checkins.map((c: { mood: number | null }) => c.mood))}/10, energy=${avg(checkins.map((c: { energy: number | null }) => c.energy))}/10, stress=${avg(checkins.map((c: { stress: number | null }) => c.stress))}/10, closeness=${avg(checkins.map((c: { closeness: number | null }) => c.closeness))}/10. Shared: "${freeTexts}". Write a warm 3-sentence weekly recap with one actionable suggestion.`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const summaryText = message.content[0].type === 'text' ? message.content[0].text : ''

    await supabase.from('checkin_summaries').upsert({
      workspace_id: workspace.id,
      checkin_date: today,
      summary_text: summaryText,
    })

    // Rate limit: 1 workspace per second
    await new Promise(r => setTimeout(r, 1000))
  }

  return new Response('Weekly recaps generated', { status: 200 })
})
