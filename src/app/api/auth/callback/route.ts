import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Create workspace + profile on first sign-in
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existing) {
        const { data: workspace } = await supabase
          .from('workspaces')
          .insert({})
          .select('id')
          .single()

        if (workspace) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            workspace_id: workspace.id,
            display_name: data.user.email?.split('@')[0] ?? 'Partner',
            role: 'initiator',
          })
        }
      }

      return NextResponse.redirect(`${origin}/onboarding`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
