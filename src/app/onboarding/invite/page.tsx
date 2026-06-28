'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function InvitePage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  async function generateLink() {
    setLoading(true)
    const res = await fetch('/api/invite', { method: 'POST' })
    const data = await res.json()
    setToken(data.token)
    setLoading(false)
  }

  async function copy() {
    const link = `${location.origin}/invite/${token}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
        <h2 className="text-xl font-semibold text-stone-800 mb-2">Invite your partner</h2>
        <p className="text-stone-500 text-sm mb-6">
          Send them a private invite link. It expires in 72 hours and can only be used once.
        </p>

        {!token ? (
          <button
            onClick={generateLink}
            disabled={loading}
            className="w-full py-3 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors mb-4"
          >
            {loading ? 'Generating…' : 'Generate invite link'}
          </button>
        ) : (
          <div className="mb-4">
            <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200 mb-3">
              <span className="flex-1 text-xs text-stone-600 truncate font-mono">
                {location.origin}/invite/{token}
              </span>
              <button
                onClick={copy}
                className="text-xs text-stone-800 font-medium hover:underline"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-3 border border-stone-200 text-stone-600 rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors"
        >
          Skip for now, go to dashboard
        </button>
      </div>
    </div>
  )
}
