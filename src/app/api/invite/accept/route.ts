import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/invite/accept — link accepting user to the invite's workspace
export async function POST(request: Request) {
  const { token } = await request.json()
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  // Must use service role to look up token before accepting user has a workspace
  const service = await createServiceClient()
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: inviteToken } = await service
    .from('invite_tokens')
    .select('*')
    .eq('token', token)
    .single()

  if (!inviteToken) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  if (inviteToken.used_at) return NextResponse.json({ error: 'Token already used' }, { status: 410 })
  if (new Date(inviteToken.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Token expired' }, { status: 410 })
  }

  // Mark token used
  await service
    .from('invite_tokens')
    .update({ used_at: new Date().toISOString(), used_by: user.id })
    .eq('id', inviteToken.id)

  // Link accepting user's profile to the workspace (upsert handles first login)
  await service.from('profiles').upsert({
    id: user.id,
    workspace_id: inviteToken.workspace_id,
    display_name: user.email?.split('@')[0] ?? 'Partner',
    role: 'partner',
  })

  return NextResponse.json({ workspace_id: inviteToken.workspace_id })
}
