'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QUESTIONNAIRE_QUESTIONS } from '@/types'

export default function QuestionnairePage() {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers),
    })
    router.push('/onboarding/invite')
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-5">
      <div className="w-full max-w-lg bg-surface rounded-neu shadow-raised p-8">
        <h2 className="text-xl font-semibold mb-1">Tell us about yourselves</h2>
        <p className="text-ink-muted text-[13px] mb-6">
          These answers seed .chtku&apos;s memory before your first chat. Skip anything you&apos;d rather add later.
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          {QUESTIONNAIRE_QUESTIONS.map(q => (
            <div key={q.key}>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                {q.label}
              </label>
              <textarea
                rows={2}
                value={answers[q.key] ?? ''}
                onChange={e => setAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
                className="w-full px-4 py-3.5 rounded-neu-sm bg-bg-deep shadow-inset text-sm text-ink placeholder:text-ink-soft outline-none resize-none"
                placeholder="Optional — you can always add this later"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-surface text-ink rounded-neu shadow-raised text-sm font-semibold active:shadow-inset disabled:opacity-50 transition-all"
          >
            {loading ? 'Saving…' : 'Save and continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
