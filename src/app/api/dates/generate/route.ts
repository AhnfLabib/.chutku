import { createClient, getWorkspaceId } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { complete, buildCoupleContext } from '@/lib/ai'
import { buildDateGenerationPrompt } from '@/lib/prompts/dates'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const workspaceId = await getWorkspaceId(supabase)
  const { filters = {} } = await request.json()

  const ctx = await buildCoupleContext(workspaceId, 'date ideas preferences')
  const prompt = buildDateGenerationPrompt(ctx, filters)

  const raw = await complete(prompt, 1024)

  let ideas = []
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    ideas = jsonMatch ? JSON.parse(jsonMatch[0]) : []
  } catch {
    ideas = []
  }

  return NextResponse.json({ ideas })
}
