import Link from 'next/link'
import { Heart, Sparkles, Plus, BookHeart, Calendar, Hourglass } from 'lucide-react'
import { createClient, getWorkspaceId } from '@/lib/supabase/server'
import { getDashboardData } from '@/lib/dashboard'
import type { PriorityItem } from '@/types'

function priorityContent(item: PriorityItem): { icon: React.ReactNode; title: string; sub: string } {
  switch (item.type) {
    case 'milestone':
    case 'next_date': {
      const d = item.data as { title?: string; scheduled_for?: string | null; status?: string }
      return {
        icon: <Calendar size={18} className="text-accent" />,
        title: d.title ?? 'Upcoming date',
        sub: d.scheduled_for ? `${d.status === 'planned' ? 'Planned' : 'Idea'} · ${d.scheduled_for}` : 'No date set yet',
      }
    }
    case 'checkin_pending':
      return { icon: <Heart size={18} className="text-accent" />, title: 'Check in today', sub: 'Neither of you has checked in yet' }
    case 'checkin_partial': {
      const d = item.data as { submitted?: boolean }
      return d.submitted
        ? { icon: <Hourglass size={18} className="text-accent" />, title: 'Waiting for your partner', sub: 'You checked in — theirs reveals soon' }
        : { icon: <Heart size={18} className="text-accent" />, title: 'Your partner checked in', sub: 'Add yours to reveal both' }
    }
    case 'checkin_complete':
      return { icon: <Sparkles size={18} className="text-accent" />, title: 'Check-in complete', sub: "See today's summary below" }
  }
}

const quickActions = [
  { label: 'Check In', href: '/checkin', icon: Heart },
  { label: 'Plan Date', href: '/dates', icon: Sparkles },
  { label: 'Add Memory', href: '/memories', icon: Plus },
  { label: 'Memories', href: '/memories', icon: BookHeart },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const workspaceId = await getWorkspaceId(supabase)
  const { priorityItems, streak, summary } = await getDashboardData(supabase, workspaceId, user!.id)

  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight mb-1">Home</h1>
      <p className="text-ink-muted text-[13px] mb-6">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      <div className="flex items-center gap-4 bg-surface rounded-neu shadow-raised p-4.5 mb-4">
        <div className="w-13 h-13 shrink-0 rounded-full bg-surface shadow-raised-sm flex items-center justify-center text-xl font-bold text-accent">
          {streak?.current_streak ?? 0}
        </div>
        <div>
          <div className="text-[13px] text-ink-muted">Current streak</div>
          <div className="text-[15px] font-semibold">
            {streak?.current_streak ?? 0} {streak?.current_streak === 1 ? 'day' : 'days'} together
          </div>
        </div>
      </div>

      <div className="space-y-2.5 mb-4">
        {priorityItems.map((item, i) => {
          const { icon, title, sub } = priorityContent(item)
          return (
            <div key={i} className="flex items-center gap-3 bg-surface rounded-neu-sm shadow-raised-sm p-3.5">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-bg-deep shadow-inset flex items-center justify-center">
                {icon}
              </div>
              <div>
                <div className="text-[13px] font-semibold">{title}</div>
                <div className="text-[11px] text-ink-muted">{sub}</div>
              </div>
            </div>
          )
        })}
      </div>

      {summary && (
        <div className="bg-surface rounded-neu shadow-raised p-4.5 mb-4">
          <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2">
            Today&apos;s summary
          </div>
          <p className="text-[13px] leading-relaxed text-ink-muted">{summary.summary_text}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {quickActions.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="bg-surface rounded-neu shadow-raised-sm p-4.5 text-center text-xs font-semibold text-ink-muted active:shadow-inset transition-all"
          >
            <Icon size={22} className="mx-auto mb-2 text-accent" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
