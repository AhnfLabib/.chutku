import { createClient, getWorkspaceId } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const workspaceId = await getWorkspaceId(supabase)
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single()

  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const workspaceId = await getWorkspaceId(supabase)
  const body = await request.json()

  const { data, error } = await supabase
    .from('memories')
    .update({ title: body.title, content: body.content, tags: body.tags, memory_date: body.memory_date })
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const workspaceId = await getWorkspaceId(supabase)
  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
