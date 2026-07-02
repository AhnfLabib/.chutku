'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function InviteAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const [step, setStep] = useState<'accept' | 'login' | 'done'>('accept')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAccept() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setStep('login')
      setLoading(false)
      return
    }

    const res = await fetch('/api/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    if (res.ok) {
      setStep('done')
      setTimeout(() => router.push('/onboarding'), 1500)
    }
    setLoading(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/api/auth/callback?next=/invite/${token}`,
      },
    })
    setLoading(false)
    alert('Check your email for a magic link to continue.')
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-ink-muted text-sm">Linked! Taking you to onboarding…</p>
      </div>
    )
  }

  if (step === 'login') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-5">
        <div className="w-full max-w-sm bg-surface rounded-neu shadow-raised p-8">
          <h2 className="text-lg font-semibold mb-4">Create your account to join</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3.5 rounded-neu-sm bg-bg-deep shadow-inset text-sm text-ink placeholder:text-ink-soft outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-surface text-ink rounded-neu shadow-raised text-sm font-semibold active:shadow-inset disabled:opacity-50 transition-all"
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-5">
      <div className="w-full max-w-sm bg-surface rounded-neu shadow-raised p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">You&apos;ve been invited</h2>
        <p className="text-ink-muted text-[13px] mb-8">Join your partner&apos;s private .chtku space.</p>
        <button
          onClick={handleAccept}
          disabled={loading}
          className="w-full py-4 bg-surface text-ink rounded-neu shadow-raised text-sm font-semibold active:shadow-inset disabled:opacity-50 transition-all"
        >
          {loading ? 'Joining…' : 'Accept invite'}
        </button>
      </div>
    </div>
  )
}
