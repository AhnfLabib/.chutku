import { getPostAuthRedirect, shouldBootstrapWorkspace } from '@/lib/auth/post-auth'
import { createClient, ensureInitiatorWorkspace } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      let onboardingComplete = false

      if (shouldBootstrapWorkspace(next)) {
        const bootstrap = await ensureInitiatorWorkspace(data.user)
        onboardingComplete = bootstrap.onboardingComplete
      }

      const destination = getPostAuthRedirect({
        requestedNext: next,
        onboardingComplete,
      })
      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
