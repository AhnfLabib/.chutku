'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Memory } from '@/types'

interface FormState {
  id: string | null
  title: string
  content: string
  tags: string
  memory_date: string
}

const EMPTY_FORM: FormState = { id: null, title: '', content: '', tags: '', memory_date: '' }

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (tag: string | null) => {
    const res = await fetch(tag ? `/api/memories?tag=${encodeURIComponent(tag)}` : '/api/memories')
    if (res.ok) setMemories(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    load(null)
  }, [load])

  function selectTag(tag: string | null) {
    setActiveTag(tag)
    load(tag)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setError(null)

    const payload = {
      title: form.title,
      content: form.content,
      tags: form.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
      memory_date: form.memory_date || null,
    }

    const res = form.id
      ? await fetch(`/api/memories/${form.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      : await fetch('/api/memories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      setError(body?.error ?? 'Could not save. Try again.')
    } else {
      setForm(null)
      await load(activeTag)
    }
    setSaving(false)
  }

  async function remove(id: string) {
    const res = await fetch(`/api/memories/${id}`, { method: 'DELETE' })
    if (res.ok) await load(activeTag)
  }

  const allTags = [...new Set(memories.flatMap(m => m.tags))].sort()

  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight mb-1">Memories</h1>
      <p className="text-ink-muted text-[13px] mb-5">
        {memories.length} shared · tagged &amp; filterable
      </p>

      {allTags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-5">
          <button
            onClick={() => selectTag(null)}
            className={`text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full transition-all ${
              activeTag === null ? 'text-accent bg-bg-deep shadow-inset' : 'text-ink-soft bg-surface shadow-raised-sm'
            }`}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => selectTag(tag)}
              className={`text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full transition-all ${
                activeTag === tag ? 'text-accent bg-bg-deep shadow-inset' : 'text-ink-soft bg-surface shadow-raised-sm'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {form && (
        <form onSubmit={save} className="bg-surface rounded-neu shadow-raised p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold">{form.id ? 'Edit memory' : 'New memory'}</span>
            <button type="button" onClick={() => setForm(null)} className="text-ink-soft" aria-label="Close form">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-3">
            <input
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Title"
              className="w-full px-4 py-3 rounded-neu-sm bg-bg-deep shadow-inset text-sm text-ink placeholder:text-ink-soft outline-none"
            />
            <textarea
              required
              rows={3}
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="What do you want to remember?"
              className="w-full px-4 py-3 rounded-neu-sm bg-bg-deep shadow-inset text-sm text-ink placeholder:text-ink-soft outline-none resize-none"
            />
            <input
              value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })}
              placeholder="Tags, comma separated (favorite, event…)"
              className="w-full px-4 py-3 rounded-neu-sm bg-bg-deep shadow-inset text-sm text-ink placeholder:text-ink-soft outline-none"
            />
            <input
              type="date"
              value={form.memory_date}
              onChange={e => setForm({ ...form, memory_date: e.target.value })}
              className="w-full px-4 py-3 rounded-neu-sm bg-bg-deep shadow-inset text-sm text-ink-muted outline-none"
            />
            {error && <p className="text-[12px] text-rose">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-surface text-ink rounded-neu shadow-raised text-sm font-semibold active:shadow-inset disabled:opacity-50 transition-all"
            >
              {saving ? 'Saving…' : form.id ? 'Save changes' : 'Add memory'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="bg-surface rounded-neu shadow-raised p-5 text-[13px] text-ink-muted">Loading…</div>
      ) : memories.length === 0 ? (
        <div className="bg-surface rounded-neu shadow-raised p-7 text-center text-[13px] text-ink-muted">
          No memories yet — add your first one.
        </div>
      ) : (
        <div className="space-y-3">
          {memories.map(m => (
            <div key={m.id} className="bg-surface rounded-neu shadow-raised p-4.5">
              {m.tags.length > 0 && (
                <div className="flex gap-1.5 mb-2">
                  {m.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-[10px] font-semibold uppercase tracking-wider text-accent px-2.5 py-1 rounded-full bg-bg-deep shadow-inset"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-sm font-semibold mb-1">{m.title}</div>
              <p className="text-xs text-ink-muted leading-relaxed">{m.content}</p>
              {m.created_by === userId && (
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={() =>
                      setForm({
                        id: m.id,
                        title: m.title,
                        content: m.content,
                        tags: m.tags.join(', '),
                        memory_date: m.memory_date ?? '',
                      })
                    }
                    className="text-ink-soft"
                    aria-label="Edit memory"
                  >
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => remove(m.id)} className="text-ink-soft" aria-label="Delete memory">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!form && (
        <button
          onClick={() => setForm(EMPTY_FORM)}
          aria-label="Add memory"
          className="fixed right-6 bottom-28 w-13 h-13 rounded-full bg-surface shadow-raised text-accent flex items-center justify-center active:shadow-inset transition-all"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  )
}
