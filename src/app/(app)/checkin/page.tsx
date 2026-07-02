'use client'

import { useCallback, useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import type { CheckinStateResponse } from '@/types'

const SCALES = [
  { key: 'mood', label: 'Mood' },
  { key: 'energy', label: 'Energy' },
  { key: 'stress', label: 'Stress' },
  { key: 'closeness', label: 'Closeness' },
] as const

type ScaleKey = (typeof SCALES)[number]['key']

function fillStyle(value: number) {
  const pct = ((value - 1) / 9) * 100
  return {
    backgroundImage: `linear-gradient(90deg, var(--color-accent-soft), var(--color-accent) ${pct}%, transparent ${pct}%)`,
  }
}

function hoursUntilReveal(partnerSubmittedAt: string): number {
  const revealAt = new Date(partnerSubmittedAt).getTime() + 24 * 60 * 60 * 1000
  return Math.max(1, Math.ceil((revealAt - Date.now()) / (60 * 60 * 1000)))
}

export default function CheckinPage() {
  const [state, setState] = useState<CheckinStateResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [values, setValues] = useState<Record<ScaleKey, number>>({ mood: 5, energy: 5, stress: 5, closeness: 5 })
  const [freeText, setFreeText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/checkin')
    if (res.ok) setState(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, free_text: freeText.trim() || null }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setError(body?.error ?? 'Something went wrong. Try again.')
    } else {
      await load()
    }
    setSubmitting(false)
  }

  const header = (
    <>
      <h1 className="text-[26px] font-semibold tracking-tight mb-1">Check In</h1>
      <p className="text-ink-muted text-[13px] mb-6">
        {state?.streak?.current_streak
          ? `Day ${state.streak.current_streak} streak · prompt rotates daily`
          : 'Prompt rotates daily'}
      </p>
    </>
  )

  if (loading) {
    return (
      <div>
        {header}
        <div className="bg-surface rounded-neu shadow-raised p-5 text-[13px] text-ink-muted">Loading…</div>
      </div>
    )
  }

  if (!state) {
    return (
      <div>
        {header}
        <div className="bg-surface rounded-neu shadow-raised p-5 text-[13px] text-ink-muted">
          Couldn&apos;t load today&apos;s check-in. Refresh to try again.
        </div>
      </div>
    )
  }

  // ── Not yet submitted: the form ──────────────────────────────────────────
  if (!state.myCheckin) {
    return (
      <div>
        {header}
        <form onSubmit={submit} className="bg-surface rounded-neu shadow-raised p-5">
          <p className="text-[15px] font-medium leading-relaxed mb-5">
            &ldquo;{state.prompt?.prompt_text ?? 'How are you really doing today?'}&rdquo;
          </p>

          {SCALES.map(({ key, label }) => (
            <div key={key} className="mb-4">
              <div className="flex justify-between text-xs font-semibold text-ink-muted mb-2">
                <span>{label}</span>
                <span className="text-accent">{values[key]}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={values[key]}
                onChange={e => setValues(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                className="neu-range"
                style={fillStyle(values[key])}
              />
            </div>
          ))}

          <textarea
            rows={3}
            value={freeText}
            onChange={e => setFreeText(e.target.value)}
            placeholder="Anything else on your mind…"
            className="w-full px-4 py-3.5 rounded-neu-sm bg-bg-deep shadow-inset text-sm text-ink placeholder:text-ink-soft outline-none resize-none mb-2"
          />

          {error && <p className="text-[12px] text-rose mb-2">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-surface text-ink rounded-neu shadow-raised text-sm font-semibold active:shadow-inset disabled:opacity-50 transition-all"
          >
            {submitting ? 'Submitting…' : 'Submit check-in'}
          </button>
        </form>
      </div>
    )
  }

  // ── Submitted: own recap + partner state ─────────────────────────────────
  const mine = state.myCheckin
  return (
    <div>
      {header}

      <div className="bg-surface rounded-neu shadow-raised p-5 mb-4">
        <div className="text-xs text-ink-muted mb-3">Your response</div>
        <div className="bg-bg-deep rounded-neu-sm shadow-inset p-4">
          <div className="text-xs text-ink-muted mb-1.5">
            Mood {mine.mood} · Energy {mine.energy} · Stress {mine.stress} · Closeness {mine.closeness}
          </div>
          {mine.free_text && <p className="text-[13px] leading-relaxed">{mine.free_text}</p>}
        </div>
      </div>

      {state.partnerCheckin ? (
        <div className="bg-surface rounded-neu shadow-raised p-5 mb-4">
          <div className="text-xs text-ink-muted mb-3">Your partner&apos;s response</div>
          <div className="bg-bg-deep rounded-neu-sm shadow-inset p-4">
            <div className="text-xs text-ink-muted mb-1.5">
              Mood {state.partnerCheckin.mood} · Energy {state.partnerCheckin.energy} · Stress{' '}
              {state.partnerCheckin.stress} · Closeness {state.partnerCheckin.closeness}
            </div>
            {state.partnerCheckin.free_text && (
              <p className="text-[13px] leading-relaxed">{state.partnerCheckin.free_text}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-neu shadow-raised p-7 mb-4 text-center">
          <div className="w-16 h-16 mx-auto mb-3.5 rounded-full bg-surface shadow-inset-deep flex items-center justify-center">
            <Lock size={22} className="text-ink-muted" />
          </div>
          <div className="text-sm font-semibold mb-1">Partner&apos;s response locked</div>
          <div className="text-xs text-ink-muted">
            {state.partnerSubmittedAt
              ? `Reveals in ${hoursUntilReveal(state.partnerSubmittedAt)}h — or when you both check in`
              : 'Waiting for your partner to check in'}
          </div>
        </div>
      )}

      {state.summary && (
        <div className="bg-surface rounded-neu shadow-raised p-5">
          <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2">
            Today&apos;s summary
          </div>
          <p className="text-[13px] leading-relaxed text-ink-muted">{state.summary.summary_text}</p>
        </div>
      )}
    </div>
  )
}
