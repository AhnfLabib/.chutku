import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async () => {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString()
  const twentyOneHoursAgo = new Date(now.getTime() - 21 * 60 * 60 * 1000).toISOString()

  // Find checkins submitted ~20hr ago where the partner hasn't responded yet
  const { data: checkins } = await supabase
    .from('checkins')
    .select('workspace_id, user_id, submitted_at')
    .eq('checkin_date', today)
    .gte('submitted_at', twentyOneHoursAgo)
    .lte('submitted_at', twentyHoursAgo)

  if (!checkins?.length) return new Response('No nudges needed', { status: 200 })

  for (const checkin of checkins) {
    // Check if partner also submitted
    const { data: partnerCheckin } = await supabase
      .from('checkins')
      .select('id')
      .eq('workspace_id', checkin.workspace_id)
      .eq('checkin_date', today)
      .neq('user_id', checkin.user_id)
      .single()

    if (!partnerCheckin) {
      // Partner hasn't submitted — nudge them (log for now; wire to email/push in prod)
      console.log(`Nudge workspace ${checkin.workspace_id}: partner hasn't checked in`)
    }
  }

  return new Response('Nudges processed', { status: 200 })
})
