'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function InvitePage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generateLink() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/invite', { method: 'POST' })
      const data = await res.json().catch(() => null)

      if (!res.ok || !data?.token) {
        setError(data?.error ?? 'Could not generate an invite link right now.')
        return
      }

      setToken(data.token)
    } finally {
      setLoading(false)
    }
  }

  async function copy() {
    const link = `${location.origin}/invite/${token}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-5">
      <div className="w-full max-w-sm bg-surface rounded-neu shadow-raised p-8">
        <h2 className="text-xl font-semibold mb-2">Invite your partner</h2>
        <p className="text-ink-muted text-[13px] mb-6">
          Send them a private invite link. It expires in 72 hours and can only be used once.
        </p>

        {!token ? (
          <>
            <button
              onClick={generateLink}
              disabled={loading}
              className="w-full py-4 bg-surface text-ink rounded-neu shadow-raised text-sm font-semibold active:shadow-inset disabled:opacity-50 transition-all mb-4"
            >
              {loading ? 'Generating…' : 'Generate invite link'}
            </button>
            {error && (
              <p className="text-xs text-red-600 mb-4">{error}</p>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 px-4 py-3.5 bg-bg-deep rounded-neu-sm shadow-inset mb-4">
            <span className="flex-1 text-xs text-ink-muted truncate font-mono">
              {location.origin}/invite/{token}
            </span>
            <button onClick={copy} className="text-xs text-accent font-semibold">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-3.5 bg-surface text-ink-muted rounded-neu shadow-raised-sm text-sm font-medium active:shadow-inset transition-all"
        >
          Skip for now, go to dashboard
        </button>
      </div>
    </div>
  )
}
