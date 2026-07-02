import { createClient, getWorkspaceId } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

// POST /api/invite — create a 72hr invite token
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const workspaceId = await getWorkspaceId(supabase)
  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('invite_tokens')
    .insert({ workspace_id: workspaceId, created_by: user.id, token, expires_at: expiresAt })
    .select('token, expires_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
