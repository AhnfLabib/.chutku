'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Sparkles, Trash2, Check, CalendarPlus, X } from 'lucide-react'
import type { DatePlan, DateIdea } from '@/types'

type StatusFilter = 'all' | 'idea' | 'planned' | 'completed'

const CATEGORIES = ['Any', 'Food', 'Outdoors', 'At home', 'Culture', 'Adventure']
const BUDGETS = ['Any', 'Free', '$', '$$', '$$$']
const DURATIONS = ['Any', 'Quick', 'Half-day', 'Full-day']

interface GenerateFilters {
  category: string
  budget: string
  duration: string
}

interface ManualForm {
  title: string
  description: string
  category: string
  scheduled_for: string
}

const EMPTY_MANUAL: ManualForm = { title: '', description: '', category: '', scheduled_for: '' }

function pillClass(active: boolean) {
  return `text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full transition-all ${
    active ? 'text-accent bg-bg-deep shadow-inset' : 'text-ink-soft bg-surface shadow-raised-sm'
  }`
}

export default function DatesPage() {
  const [plans, setPlans] = useState<DatePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [fetchVersion, setFetchVersion] = useState(0)

  const [filters, setFilters] = useState<GenerateFilters>({ category: 'Any', budget: 'Any', duration: 'Any' })
  const [generating, setGenerating] = useState(false)
  const [ideas, setIdeas] = useState<DateIdea[]>([])
  const [genError, setGenError] = useState<string | null>(null)
  const [savingIdea, setSavingIdea] = useState<string | null>(null)

  const [showManual, setShowManual] = useState(false)
  const [manualForm, setManualForm] = useState<ManualForm>(EMPTY_MANUAL)
  const [savingManual, setSavingManual] = useState(false)
  const [manualError, setManualError] = useState<string | null>(null)

  const [scheduleDates, setScheduleDates] = useState<Record<string, string>>({})
  const [patching, setPatching] = useState<string | null>(null)

  const reload = useCallback(() => setFetchVersion(v => v + 1), [])

  useEffect(() => {
    const ac = new AbortController()
    fetch('/api/dates', { signal: ac.signal })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((data: DatePlan[]) => { setPlans(data); setLoading(false) })
      .catch(() => { if (!ac.signal.aborted) setLoading(false) })
    return () => ac.abort()
  }, [fetchVersion])

  const filtered = plans.filter(p => statusFilter === 'all' || p.status === statusFilter)

  async function generate() {
    setGenerating(true)
    setGenError(null)
    setIdeas([])
    try {
      const body: Record<string, string | undefined> = {}
      if (filters.category !== 'Any') body.category = filters.category.toLowerCase()
      if (filters.budget !== 'Any') body.budget = filters.budget.toLowerCase()
      if (filters.duration !== 'Any') body.duration = filters.duration.toLowerCase()

      const res = await fetch('/api/dates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: body }),
      })
      if (!res.ok) throw new Error('Request failed')
      const json = await res.json()
      const returned: DateIdea[] = json.ideas ?? []
      if (returned.length === 0) {
        setGenError("Couldn't generate ideas right now — make sure the AI is running and try again.")
      } else {
        setIdeas(returned)
      }
    } catch {
      setGenError('Something went wrong generating ideas. Please try again.')
    }
    setGenerating(false)
  }

  async function saveIdea(idea: DateIdea) {
    setSavingIdea(idea.title)
    const res = await fetch('/api/dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: idea.title,
        description: idea.description,
        category: idea.category,
        estimated_cost: idea.estimated_cost,
        duration: idea.duration,
        source: 'ai_generated',
      }),
    })
    if (res.ok) {
      setIdeas(prev => prev.filter(i => i.title !== idea.title))
      reload()
    }
    setSavingIdea(null)
  }

  async function saveManual(e: React.FormEvent) {
    e.preventDefault()
    setSavingManual(true)
    setManualError(null)
    const res = await fetch('/api/dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: manualForm.title,
        description: manualForm.description || null,
        category: manualForm.category || null,
        scheduled_for: manualForm.scheduled_for || null,
        source: 'manual',
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setManualError(body?.error ?? 'Could not save. Try again.')
    } else {
      setManualForm(EMPTY_MANUAL)
      setShowManual(false)
      reload()
    }
    setSavingManual(false)
  }

  async function patchPlan(id: string, update: Record<string, string>) {
    setPatching(id)
    const res = await fetch(`/api/dates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })
    if (res.ok) reload()
    setPatching(null)
  }

  async function deletePlan(id: string) {
    const res = await fetch(`/api/dates/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPlans(prev => prev.filter(p => p.id !== id))
    }
  }

  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight mb-1">Dates</h1>
      <p className="text-ink-muted text-[13px] mb-5">
        {plans.length} {plans.length === 1 ? 'plan' : 'plans'} · AI-powered date ideas
      </p>

      {/* AI generation card */}
      <div className="bg-surface rounded-neu shadow-raised p-5 mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft mb-3">Generate ideas</p>

        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft mb-1.5">Category</p>
        <div className="flex gap-2 flex-wrap mb-3">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setFilters(f => ({ ...f, category: c }))} className={pillClass(filters.category === c)}>
              {c}
            </button>
          ))}
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft mb-1.5">Budget</p>
        <div className="flex gap-2 flex-wrap mb-3">
          {BUDGETS.map(b => (
            <button key={b} onClick={() => setFilters(f => ({ ...f, budget: b }))} className={pillClass(filters.budget === b)}>
              {b}
            </button>
          ))}
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft mb-1.5">Duration</p>
        <div className="flex gap-2 flex-wrap mb-4">
          {DURATIONS.map(d => (
            <button key={d} onClick={() => setFilters(f => ({ ...f, duration: d }))} className={pillClass(filters.duration === d)}>
              {d}
            </button>
          ))}
        </div>

        <button
          onClick={generate}
          disabled={generating}
          className="w-full py-3.5 bg-surface text-ink rounded-neu shadow-raised text-sm font-semibold active:shadow-inset disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles size={15} />
          {generating ? 'Generating… this can take a minute' : 'Generate date ideas'}
        </button>

        {genError && (
          <p className="text-[12px] text-ink-muted mt-3 text-center">{genError}</p>
        )}

        {ideas.length > 0 && (
          <div className="mt-4 space-y-3">
            {ideas.map(idea => (
              <div key={idea.title} className="bg-bg-deep rounded-neu-sm shadow-inset p-4">
                <div className="text-sm font-semibold mb-1">{idea.title}</div>
                <p className="text-xs text-ink-muted leading-relaxed mb-2">{idea.description}</p>
                <p className="text-xs text-accent italic flex items-start gap-1 mb-2">
                  <Sparkles size={11} className="mt-0.5 shrink-0" />
                  {idea.why}
                </p>
                <p className="text-[10px] text-ink-soft mb-3">
                  {[idea.category, idea.estimated_cost, idea.duration].filter(Boolean).join(' · ')}
                </p>
                <button
                  onClick={() => saveIdea(idea)}
                  disabled={savingIdea === idea.title}
                  className="w-full py-2.5 bg-surface text-ink rounded-neu-sm shadow-raised text-xs font-semibold active:shadow-inset disabled:opacity-50 transition-all"
                >
                  {savingIdea === idea.title ? 'Saving…' : 'Save idea'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 mb-4">
        {(['all', 'idea', 'planned', 'completed'] as StatusFilter[]).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={pillClass(statusFilter === s)}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Manual add form */}
      {showManual && (
        <form onSubmit={saveManual} className="bg-surface rounded-neu shadow-raised p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold">New date idea</span>
            <button type="button" onClick={() => { setShowManual(false); setManualForm(EMPTY_MANUAL) }} className="text-ink-soft" aria-label="Close form">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-3">
            <input
              required
              value={manualForm.title}
              onChange={e => setManualForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Title"
              className="w-full px-4 py-3 rounded-neu-sm bg-bg-deep shadow-inset text-sm text-ink placeholder:text-ink-soft outline-none"
            />
            <textarea
              rows={2}
              value={manualForm.description}
              onChange={e => setManualForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description (optional)"
              className="w-full px-4 py-3 rounded-neu-sm bg-bg-deep shadow-inset text-sm text-ink placeholder:text-ink-soft outline-none resize-none"
            />
            <input
              value={manualForm.category}
              onChange={e => setManualForm(f => ({ ...f, category: e.target.value }))}
              placeholder="Category (optional)"
              className="w-full px-4 py-3 rounded-neu-sm bg-bg-deep shadow-inset text-sm text-ink placeholder:text-ink-soft outline-none"
            />
            <input
              type="date"
              value={manualForm.scheduled_for}
              onChange={e => setManualForm(f => ({ ...f, scheduled_for: e.target.value }))}
              className="w-full px-4 py-3 rounded-neu-sm bg-bg-deep shadow-inset text-sm text-ink-muted outline-none"
            />
            {manualError && <p className="text-[12px] text-rose">{manualError}</p>}
            <button
              type="submit"
              disabled={savingManual}
              className="w-full py-3.5 bg-surface text-ink rounded-neu shadow-raised text-sm font-semibold active:shadow-inset disabled:opacity-50 transition-all"
            >
              {savingManual ? 'Saving…' : 'Add date idea'}
            </button>
          </div>
        </form>
      )}

      {/* Plans list */}
      {loading ? (
        <div className="bg-surface rounded-neu shadow-raised p-5 text-[13px] text-ink-muted">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface rounded-neu shadow-raised p-7 text-center text-[13px] text-ink-muted">
          {plans.length === 0 ? 'No date plans yet — generate some ideas or add one manually.' : 'No plans match this filter.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              scheduleDate={scheduleDates[plan.id] ?? ''}
              onScheduleDateChange={val => setScheduleDates(prev => ({ ...prev, [plan.id]: val }))}
              patching={patching === plan.id}
              onPatch={update => patchPlan(plan.id, update)}
              onDelete={() => deletePlan(plan.id)}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      {!showManual && (
        <button
          onClick={() => setShowManual(true)}
          aria-label="Add date idea"
          className="fixed right-6 bottom-28 w-13 h-13 rounded-full bg-surface shadow-raised text-accent flex items-center justify-center active:shadow-inset transition-all"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  )
}

interface PlanCardProps {
  plan: DatePlan
  scheduleDate: string
  onScheduleDateChange: (val: string) => void
  patching: boolean
  onPatch: (update: Record<string, string>) => void
  onDelete: () => void
}

function PlanCard({ plan, scheduleDate, onScheduleDateChange, patching, onPatch, onDelete }: PlanCardProps) {
  const meta = [plan.category, plan.estimated_cost, plan.duration].filter(Boolean).join(' · ')

  return (
    <div className="bg-surface rounded-neu shadow-raised p-4">
      {/* Status chip */}
      <div className="mb-2">
        {plan.status === 'idea' && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft px-2.5 py-1 rounded-full bg-bg-deep shadow-inset">
            Idea
          </span>
        )}
        {plan.status === 'planned' && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-accent px-2.5 py-1 rounded-full bg-bg-deep shadow-inset">
            Planned{plan.scheduled_for ? ` · ${plan.scheduled_for}` : ''}
          </span>
        )}
        {plan.status === 'completed' && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft px-2.5 py-1 rounded-full bg-bg-deep shadow-inset">
            Completed
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold flex items-center gap-1">
            {plan.title}
            {plan.source === 'ai_generated' && <Sparkles size={11} className="text-accent shrink-0" />}
          </div>
          {plan.description && (
            <p className="text-xs text-ink-muted leading-relaxed mt-0.5">{plan.description}</p>
          )}
          {meta && <p className="text-[10px] text-ink-soft mt-1">{meta}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-col gap-2">
        {plan.status === 'idea' && (
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={scheduleDate}
              onChange={e => onScheduleDateChange(e.target.value)}
              className="flex-1 px-3 py-2 rounded-neu-sm bg-bg-deep shadow-inset text-xs text-ink-muted outline-none"
            />
            <button
              onClick={() => {
                if (scheduleDate) onPatch({ status: 'planned', scheduled_for: scheduleDate })
              }}
              disabled={patching || !scheduleDate}
              aria-label="Schedule date"
              className="text-accent disabled:opacity-40"
            >
              <CalendarPlus size={16} />
            </button>
            <button onClick={onDelete} aria-label="Delete plan" className="text-ink-soft">
              <Trash2 size={15} />
            </button>
          </div>
        )}
        {plan.status === 'planned' && (
          <div className="flex gap-3 items-center">
            <button
              onClick={() => onPatch({ status: 'completed' })}
              disabled={patching}
              aria-label="Mark completed"
              className="text-accent disabled:opacity-40"
            >
              <Check size={16} />
            </button>
            <button onClick={onDelete} aria-label="Delete plan" className="text-ink-soft">
              <Trash2 size={15} />
            </button>
          </div>
        )}
        {plan.status === 'completed' && (
          <div className="flex gap-3 items-center">
            <button onClick={onDelete} aria-label="Delete plan" className="text-ink-soft">
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
