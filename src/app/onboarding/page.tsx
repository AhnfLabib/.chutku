import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ensureInitiatorWorkspace } from '@/lib/supabase/server'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let { data: profile } = await supabase
    .from('profiles')
    .select('display_name, onboarding_complete')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    await ensureInitiatorWorkspace(user)
    const refreshed = await supabase
      .from('profiles')
      .select('display_name, onboarding_complete')
      .eq('id', user.id)
      .single()

    profile = refreshed.data
  }

  if (profile?.onboarding_complete) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-5">
      <div className="w-full max-w-sm bg-surface rounded-neu shadow-raised p-8">
        <h1 className="text-xl font-semibold mb-2">Welcome to .chtku</h1>
        <p className="text-ink-muted text-[13px] mb-7">
          Let&apos;s set things up so .chtku feels personal from day one.
        </p>
        <a
          href="/onboarding/questionnaire"
          className="block w-full text-center py-4 bg-surface text-ink rounded-neu shadow-raised text-sm font-semibold active:shadow-inset transition-all"
        >
          Get started
        </a>
      </div>
    </div>
  )
}
