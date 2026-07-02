import { createClient, getWorkspaceId } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { complete } from '@/lib/ai'
import { buildCheckinSummaryPrompt, buildTemplateCheckinSummary } from '@/lib/prompts/checkin'

const UNLOCK_MS = 24 * 60 * 60 * 1000

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const workspaceId = await getWorkspaceId(supabase)
  const today = new Date().toISOString().split('T')[0]

  const { data: checkins } = await supabase
    .from('checkins')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('checkin_date', today)

  const myCheckin = checkins?.find(c => c.user_id === user.id) ?? null
  const partnerRow = checkins?.find(c => c.user_id !== user.id) ?? null

  // 24hr unlock: only reveal partner's response after 24hr or once both submitted
  const bothSubmitted = !!myCheckin && !!partnerRow
  const partnerUnlocked = partnerRow
    ? bothSubmitted || Date.now() - new Date(partnerRow.submitted_at).getTime() > UNLOCK_MS
    : false
  const partnerCheckin = partnerUnlocked ? partnerRow : null

  const { data: summary } = await supabase
    .from('checkin_summaries')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('checkin_date', today)
    .single()

  const { data: promptId } = await supabase.rpc('get_daily_prompt', {
    ws_id: workspaceId,
    for_date: today,
  })

  const { data: prompt } = await supabase
    .from('checkin_prompts')
    .select('*')
    .eq('id', promptId)
    .single()

  const { data: streak } = await supabase
    .from('checkin_streaks')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single()

  return NextResponse.json({
    myCheckin,
    partnerCheckin,
    summary: summary ?? null,
    prompt: prompt ?? null,
    streak: streak ?? null,
    bothSubmitted,
    partnerSubmittedAt: partnerRow?.submitted_at ?? null,
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const workspaceId = await getWorkspaceId(supabase)
  const today = new Date().toISOString().split('T')[0]
  const body = await request.json()

  const { data: promptId } = await supabase.rpc('get_daily_prompt', {
    ws_id: workspaceId,
    for_date: today,
  })

  const { data: checkin, error } = await supabase
    .from('checkins')
    .upsert({
      workspace_id: workspaceId,
      user_id: user.id,
      prompt_id: promptId,
      checkin_date: today,
      mood: body.mood,
      energy: body.energy,
      stress: body.stress,
      closeness: body.closeness,
      free_text: body.free_text,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update streak
  await supabase.rpc('update_checkin_streak', { ws_id: workspaceId, check_date: today })

  // Generate summary if both partners have now submitted
  const { data: allCheckins } = await supabase
    .from('checkins')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('checkin_date', today)

  if (allCheckins && allCheckins.length === 2) {
    const existing = await supabase
      .from('checkin_summaries')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('checkin_date', today)
      .single()

    if (!existing.data) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('workspace_id', workspaceId)

      const prompt = buildCheckinSummaryPrompt(allCheckins, profiles ?? [])
      const summaryText =
        (await complete(prompt, 300)) ||
        buildTemplateCheckinSummary(allCheckins, profiles ?? [])
      await supabase.from('checkin_summaries').insert({
        workspace_id: workspaceId,
        checkin_date: today,
        summary_text: summaryText,
      })
    }
  }

  return NextResponse.json(checkin, { status: 201 })
}
