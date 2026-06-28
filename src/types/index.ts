export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// ─── Database row types ───────────────────────────────────────────────────────

export interface Workspace {
  id: string
  name: string | null
  created_at: string
}

export interface Profile {
  id: string
  workspace_id: string | null
  display_name: string
  avatar_url: string | null
  onboarding_complete: boolean
  role: 'initiator' | 'partner'
  created_at: string
  updated_at: string
}

export interface InviteToken {
  id: string
  workspace_id: string
  created_by: string
  token: string
  expires_at: string
  used_at: string | null
  used_by: string | null
  created_at: string
}

export interface QuestionnaireAnswer {
  id: string
  workspace_id: string
  user_id: string
  question_key: string
  answer: string
  created_at: string
}

export type MemoryTag = 'event' | 'favorite' | 'gift_idea' | 'story' | 'place' | 'future_plan' | 'reminder'
export type MemorySource = 'manual' | 'ai_suggested' | 'onboarding'

export interface Memory {
  id: string
  workspace_id: string
  created_by: string
  title: string
  content: string
  tags: string[]
  source: MemorySource
  confirmed: boolean
  embedding: number[] | null
  memory_date: string | null
  created_at: string
  updated_at: string
}

export interface PrivateMemory {
  id: string
  workspace_id: string
  owner_id: string
  title: string
  content: string
  tags: string[]
  created_at: string
  updated_at: string
}

export interface CheckinPrompt {
  id: string
  prompt_text: string
  active: boolean
  created_at: string
}

export interface Checkin {
  id: string
  workspace_id: string
  user_id: string
  prompt_id: string
  checkin_date: string
  mood: number | null
  energy: number | null
  stress: number | null
  closeness: number | null
  free_text: string | null
  submitted_at: string
}

export interface CheckinSummary {
  id: string
  workspace_id: string
  checkin_date: string
  summary_text: string
  generated_at: string
}

export interface CheckinStreak {
  workspace_id: string
  current_streak: number
  longest_streak: number
  last_both_date: string | null
}

export type DatePlanStatus = 'idea' | 'planned' | 'completed'
export type DatePlanSource = 'ai_generated' | 'manual'

export interface DatePlan {
  id: string
  workspace_id: string
  created_by: string
  title: string
  description: string | null
  category: string | null
  estimated_cost: string | null
  duration: string | null
  scheduled_for: string | null
  status: DatePlanStatus
  source: DatePlanSource
  created_at: string
  updated_at: string
}

// ─── API response types ───────────────────────────────────────────────────────

export type PriorityItemType = 'milestone' | 'checkin_pending' | 'checkin_partial' | 'checkin_complete' | 'next_date'

export interface PriorityItem {
  type: PriorityItemType
  data: Record<string, unknown>
}

export interface DashboardResponse {
  priorityItems: PriorityItem[]
}

export interface CheckinStateResponse {
  myCheckin: Checkin | null
  partnerCheckin: Checkin | null // null if locked
  summary: CheckinSummary | null
  prompt: CheckinPrompt | null
  streak: CheckinStreak | null
  bothSubmitted: boolean
  partnerSubmittedAt: string | null
}

export interface DateIdeaResponse {
  ideas: DateIdea[]
}

export interface DateIdea {
  title: string
  description: string
  category: string
  estimated_cost: string
  duration: string
  why: string
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export const QUESTIONNAIRE_QUESTIONS = [
  { key: 'partner_loves', label: 'What are some things your partner loves? (foods, hobbies, places, anything)' },
  { key: 'upcoming_dates', label: 'Are there any upcoming dates we should remember? (anniversaries, birthdays, trips)' },
  { key: 'date_styles', label: 'What kinds of dates do you two enjoy most?' },
  { key: 'partner_dislikes', label: 'Is there anything your partner dislikes that we should know?' },
  { key: 'inside_jokes', label: 'Any inside jokes, nicknames, or stories that matter to you two?' },
] as const

export type QuestionKey = typeof QUESTIONNAIRE_QUESTIONS[number]['key']
