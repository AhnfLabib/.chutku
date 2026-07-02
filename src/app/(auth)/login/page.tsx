'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-5">
      <div className="w-full max-w-sm bg-surface rounded-neu shadow-raised p-8 text-center">
        <h1 className="text-[28px] font-semibold tracking-tight mb-1.5">.chtku</h1>
        <p className="text-ink-muted text-[13px] mb-7">Your private space, together.</p>

        {sent ? (
          <div className="bg-bg-deep rounded-neu-sm shadow-inset p-4 text-sm text-ink-muted">
            Check your email for a magic link.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3.5 rounded-neu-sm bg-bg-deep shadow-inset text-sm text-ink placeholder:text-ink-soft outline-none text-left"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-surface text-ink rounded-neu shadow-raised text-sm font-semibold active:shadow-inset disabled:opacity-50 transition-all"
            >
              {loading ? 'Sending…' : 'Continue with email'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
