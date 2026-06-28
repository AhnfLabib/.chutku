import { createClient, getWorkspaceId } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { QUESTIONNAIRE_QUESTIONS } from '@/types'

// POST /api/onboarding — save questionnaire answers + auto-create confirmed memories
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const workspaceId = await getWorkspaceId(supabase)
  const body: Record<string, string> = await request.json()

  const answerRows = QUESTIONNAIRE_QUESTIONS
    .filter(q => body[q.key])
    .map(q => ({
      workspace_id: workspaceId,
      user_id: user.id,
      question_key: q.key,
      answer: body[q.key],
    }))

  await supabase.from('questionnaire_answers').upsert(answerRows)

  // Auto-create confirmed memories from answers (no confirmation prompt)
  const memoryRows = QUESTIONNAIRE_QUESTIONS
    .filter(q => body[q.key])
    .map(q => ({
      workspace_id: workspaceId,
      created_by: user.id,
      title: q.label,
      content: body[q.key],
      tags: q.key === 'upcoming_dates' ? ['event'] : ['favorite'],
      source: 'onboarding' as const,
      confirmed: true,
    }))

  await supabase.from('memories').insert(memoryRows)

  // Mark onboarding complete
  await supabase
    .from('profiles')
    .update({ onboarding_complete: true })
    .eq('id', user.id)

  return NextResponse.json({ ok: true })
}
