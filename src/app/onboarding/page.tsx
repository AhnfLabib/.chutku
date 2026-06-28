import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, onboarding_complete')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_complete) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
        <h1 className="text-xl font-semibold text-stone-800 mb-2">Welcome to .chtku</h1>
        <p className="text-stone-500 text-sm mb-6">
          Let&apos;s set things up so .chtku feels personal from day one.
        </p>
        <a
          href="/onboarding/questionnaire"
          className="block w-full text-center py-3 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors"
        >
          Get started
        </a>
      </div>
    </div>
  )
}
