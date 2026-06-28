import { createClient, getWorkspaceId } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const workspaceId = await getWorkspaceId(supabase)
  const { searchParams } = new URL(request.url)
  const tag = searchParams.get('tag')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20

  let query = supabase
    .from('memories')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('confirmed', true)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (tag) query = query.contains('tags', [tag])

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const workspaceId = await getWorkspaceId(supabase)
  const body = await request.json()

  const { data, error } = await supabase
    .from('memories')
    .insert({
      workspace_id: workspaceId,
      created_by: user.id,
      title: body.title,
      content: body.content,
      tags: body.tags ?? [],
      source: 'manual',
      confirmed: true,
      memory_date: body.memory_date ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
