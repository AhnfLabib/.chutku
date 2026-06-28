import { createClient, getWorkspaceId } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { anthropic, buildCoupleContext } from '@/lib/anthropic'
import { buildDateGenerationPrompt } from '@/lib/prompts/dates'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const workspaceId = await getWorkspaceId(supabase)
  const { filters = {} } = await request.json()

  const ctx = await buildCoupleContext(workspaceId, 'date ideas preferences')
  const prompt = buildDateGenerationPrompt(ctx, filters)

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : '[]'

  let ideas = []
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    ideas = jsonMatch ? JSON.parse(jsonMatch[0]) : []
  } catch {
    ideas = []
  }

  return NextResponse.json({ ideas })
}
