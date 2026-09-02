import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined

export const hasSupabase = Boolean(url && anonKey)
export const supabase: SupabaseClient | null = hasSupabase ? createClient(url!, anonKey!) : null

const voterStorageKey = 'team-retreat-voter-key'

function getVoterKey() {
  const saved = localStorage.getItem(voterStorageKey)
  if (saved) return saved
  const voterKey = crypto.randomUUID()
  localStorage.setItem(voterStorageKey, voterKey)
  return voterKey
}

export async function submitVote(input: {
  tripId: string
  voterName: string
  duration: string
  adults: number
  children: number
  weekends: { month: number; start: string; end: string; isPriority: boolean }[]
}) {
  if (!supabase) return { ok: false as const, reason: 'not-configured' as const }
  const voterKey = getVoterKey()
  const voterName = input.voterName.trim()
  const { error } = await supabase.from('trip_votes').insert(input.weekends.map((weekend) => ({
    trip_id: input.tripId,
    month: weekend.month,
    duration: input.duration,
    voter_name: voterName,
    weekend_start: weekend.start,
    weekend_end: weekend.end,
    attendance_date: weekend.start,
    adult_count: input.adults,
    child_count: input.children,
    is_priority: weekend.isPriority,
    voter_key: voterKey,
  })))
  if (!error) return { ok: true as const }
  return error.code === '23505'
    ? { ok: false as const, reason: 'already-voted' as const }
    : { ok: false as const, reason: 'database' as const, message: error.message }
}
