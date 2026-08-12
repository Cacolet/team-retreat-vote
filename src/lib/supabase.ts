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

export async function loadVoteCounts() {
  if (!supabase) return null
  const { data, error } = await supabase.from('trip_votes').select('trip_id')
  if (error || !data) return null
  return data.reduce<Record<string, number>>((counts, row) => {
    counts[row.trip_id] = (counts[row.trip_id] || 0) + 1
    return counts
  }, {})
}

export async function submitVote(input: { tripId: string; month: number; duration: string; voterName: string; weekendStart: string; weekendEnd: string; attendanceDate: string }) {
  if (!supabase) return { ok: false as const, reason: 'not-configured' as const }
  const { error } = await supabase.from('trip_votes').insert({
    trip_id: input.tripId,
    month: input.month,
    duration: input.duration,
    voter_name: input.voterName,
    weekend_start: input.weekendStart,
    weekend_end: input.weekendEnd,
    attendance_date: input.attendanceDate,
    voter_key: getVoterKey(),
  })
  if (!error) return { ok: true as const }
  return error.code === '23505'
    ? { ok: false as const, reason: 'already-voted' as const }
    : { ok: false as const, reason: 'database' as const, message: error.message }
}

export async function submitSuggestion(input: { month: number; duration: string; itinerary: string }) {
  if (!supabase) return { ok: false as const, reason: 'not-configured' as const }
  const { error } = await supabase.from('trip_suggestions').insert(input)
  return error ? { ok: false as const, reason: 'database' as const, message: error.message } : { ok: true as const }
}
