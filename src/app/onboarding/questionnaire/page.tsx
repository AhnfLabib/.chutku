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
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
        <h2 className="text-xl font-semibold text-stone-800 mb-1">Tell us about yourselves</h2>
        <p className="text-stone-500 text-sm mb-6">
          These answers seed .chtku&apos;s memory before your first chat. Skip anything you&apos;d rather add later.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          {QUESTIONNAIRE_QUESTIONS.map(q => (
            <div key={q.key}>
              <label className="block text-sm font-medium text-stone-700 mb-2">{q.label}</label>
              <textarea
                rows={2}
                value={answers[q.key] ?? ''}
                onChange={e => setAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-stone-300"
                placeholder="Optional — you can always add this later"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving…' : 'Save and continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
