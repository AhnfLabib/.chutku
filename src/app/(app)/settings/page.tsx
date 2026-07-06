'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Download, UserPlus, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [emailLoading, setEmailLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        setEmail(data.user?.email ?? null)
        setEmailLoading(false)
      })
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight mb-6">Settings</h1>

      <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2">Account</p>
      <div className="bg-surface rounded-neu shadow-raised p-4.5 mb-6">
        <div className="text-[11px] text-ink-muted mb-1">Signed in as</div>
        {emailLoading ? (
          <div className="h-4 w-40 bg-bg-deep rounded shadow-inset animate-pulse" />
        ) : (
          <div className="text-sm font-medium text-ink">{email ?? '—'}</div>
        )}
      </div>

      <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2">App</p>
      <div className="space-y-3 mb-6">
        <a
          href="/api/export"
          className="flex items-center gap-3 bg-surface rounded-neu shadow-raised p-4.5 text-sm font-medium text-ink active:shadow-inset transition-all"
        >
          <Download size={16} className="text-ink-soft shrink-0" />
          Export my data (JSON)
        </a>
        <Link
          href="/onboarding/invite"
          className="flex items-center gap-3 bg-surface rounded-neu shadow-raised p-4.5 text-sm font-medium text-ink active:shadow-inset transition-all"
        >
          <UserPlus size={16} className="text-ink-soft shrink-0" />
          Invite your partner
        </Link>
      </div>

      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="flex items-center gap-3 w-full bg-surface rounded-neu shadow-raised p-4.5 text-sm font-medium text-rose active:shadow-inset disabled:opacity-50 transition-all"
      >
        <LogOut size={16} className="shrink-0" />
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  )
}
