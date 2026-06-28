import { createClient, getWorkspaceId } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const workspaceId = await getWorkspaceId(supabase)
  const { searchParams } = new URL(request.url)
  const includePrivate = searchParams.get('include_private') === 'true'

  const [memories, checkins, summaries, dates, profile] = await Promise.all([
    supabase.from('memories').select('*').eq('workspace_id', workspaceId).eq('confirmed', true),
    supabase.from('checkins').select('*').eq('workspace_id', workspaceId),
    supabase.from('checkin_summaries').select('*').eq('workspace_id', workspaceId),
    supabase.from('date_plans').select('*').eq('workspace_id', workspaceId),
    supabase.from('profiles').select('id, display_name, role, created_at').eq('id', user.id).single(),
  ])

  const exportData: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    profile: profile.data,
    memories: memories.data,
    checkins: checkins.data,
    checkin_summaries: summaries.data,
    date_plans: dates.data,
  }

  if (includePrivate) {
    const { data: privateMemories } = await supabase
      .from('private_memories')
      .select('*')
      .eq('owner_id', user.id)
    exportData.private_memories = privateMemories
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="chutku-export-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}
