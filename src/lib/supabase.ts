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
  const { data, error } = await supabase.from('trip_votes').select('trip_id, voter_key, voter_name')
  if (error || !data) return null
  const votersByTrip = new Map<string, Set<string>>()
  data.forEach((row) => {
    const voter = row.voter_key || row.voter_name
    const voters = votersByTrip.get(row.trip_id) || new Set<string>()
    voters.add(voter)
    votersByTrip.set(row.trip_id, voters)
  })
  return Object.fromEntries(Array.from(votersByTrip, ([tripId, voters]) => [tripId, voters.size])) as Record<string, number>
}

export async function submitVote(input: {
  tripId: string
  duration: string
  adults: number
  children: number
  weekends: { month: number; start: string; end: string }[]
}) {
  if (!supabase) return { ok: false as const, reason: 'not-configured' as const }
  const voterKey = getVoterKey()
  const { error } = await supabase.from('trip_votes').insert(input.weekends.map((weekend) => ({
    trip_id: input.tripId,
    month: weekend.month,
    duration: input.duration,
    voter_name: '匿名参与者',
    weekend_start: weekend.start,
    weekend_end: weekend.end,
    attendance_date: weekend.start,
    adult_count: input.adults,
    child_count: input.children,
    voter_key: voterKey,
  })))
  if (!error) return { ok: true as const }
  return error.code === '23505'
    ? { ok: false as const, reason: 'already-voted' as const }
    : { ok: false as const, reason: 'database' as const, message: error.message }
}
