import type { SupabaseClient } from '@supabase/supabase-js'
import type { CheckinStreak, CheckinSummary, PriorityItem } from '@/types'

export interface DashboardData {
  priorityItems: PriorityItem[]
  streak: CheckinStreak | null
  summary: CheckinSummary | null
}

export async function getDashboardData(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string
): Promise<DashboardData> {
  const today = new Date().toISOString().split('T')[0]
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const priorityItems: PriorityItem[] = []

  // Priority 1: planned dates within the next 7 days
  const { data: upcomingDates } = await supabase
    .from('date_plans')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'planned')
    .gte('scheduled_for', today)
    .lte('scheduled_for', in7Days)
    .order('scheduled_for', { ascending: true })
    .limit(1)

  if (upcomingDates?.length) {
    priorityItems.push({ type: 'milestone', data: upcomingDates[0] as Record<string, unknown> })
  }

  // Priority 2: today's check-in status
  const { data: checkins } = await supabase
    .from('checkins')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('checkin_date', today)

  const myCheckin = checkins?.find(c => c.user_id === userId)
  const partnerCheckin = checkins?.find(c => c.user_id !== userId)

  if (!myCheckin && !partnerCheckin) {
    priorityItems.push({ type: 'checkin_pending', data: {} })
  } else if (myCheckin && !partnerCheckin) {
    priorityItems.push({ type: 'checkin_partial', data: { submitted: true, waitingForPartner: true } })
  } else if (!myCheckin && partnerCheckin) {
    priorityItems.push({ type: 'checkin_partial', data: { submitted: false, partnerWaiting: true } })
  } else {
    priorityItems.push({ type: 'checkin_complete', data: {} })
  }

  // Priority 3: next upcoming date plan
  if (priorityItems.length < 3) {
    const { data: nextDate } = await supabase
      .from('date_plans')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('status', ['idea', 'planned'])
      .order('scheduled_for', { ascending: true, nullsFirst: false })
      .limit(1)

    if (nextDate?.length) {
      priorityItems.push({ type: 'next_date', data: nextDate[0] as Record<string, unknown> })
    }
  }

  const [{ data: streak }, { data: summary }] = await Promise.all([
    supabase.from('checkin_streaks').select('*').eq('workspace_id', workspaceId).maybeSingle(),
    supabase
      .from('checkin_summaries')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('checkin_date', today)
      .maybeSingle(),
  ])

  return { priorityItems, streak: streak ?? null, summary: summary ?? null }
}
