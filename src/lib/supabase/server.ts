import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* server component — ignore */ }
        },
      },
    }
  )
}

// Service-role client: bypasses RLS. Never attach user cookies/session here —
// @supabase/ssr would substitute the user's JWT and downgrade to user RLS.
export function createServiceClient() {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function ensureInitiatorWorkspace(
  user: { id: string; email?: string | null }
): Promise<{ workspaceId: string; onboardingComplete: boolean }> {
  const service = createServiceClient()
  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select('workspace_id, display_name, role, onboarding_complete')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) throw new Error(`Profile lookup failed: ${profileError.message}`)
  if (profile?.workspace_id) {
    return {
      workspaceId: profile.workspace_id,
      onboardingComplete: Boolean(profile.onboarding_complete),
    }
  }

  const { data: workspace, error: workspaceError } = await service
    .from('workspaces')
    .insert({})
    .select('id')
    .single()

  if (workspaceError || !workspace?.id) {
    throw new Error(`Workspace creation failed: ${workspaceError?.message ?? 'Missing workspace id'}`)
  }

  const { error: upsertError } = await service.from('profiles').upsert({
    id: user.id,
    workspace_id: workspace.id,
    display_name: profile?.display_name ?? user.email?.split('@')[0] ?? 'Partner',
    role: profile?.role ?? 'initiator',
    onboarding_complete: profile?.onboarding_complete ?? false,
  })

  if (upsertError) throw new Error(`Profile bootstrap failed: ${upsertError.message}`)

  return { workspaceId: workspace.id, onboardingComplete: Boolean(profile?.onboarding_complete) }
}

export async function getWorkspaceId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('workspace_id')
    .eq('id', user.id)
    .single()
  if (error || !profile?.workspace_id) throw new Error('No workspace')
  return profile.workspace_id
}
