import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const hasSupabase = Boolean(url && anonKey)
export const supabase: SupabaseClient | null = hasSupabase ? createClient(url!, anonKey!) : null

const voterStorageKey = 'team-retreat-voter-key'

export function getVoterKey() {
  const current = localStorage.getItem(voterStorageKey)
  if (current) return current
  const next = crypto.randomUUID()
  localStorage.setItem(voterStorageKey, next)
  return next
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

export async function submitVote(tripId: string, month: number, duration: string) {
  const voterKey = getVoterKey()
  const localKey = `voted:${tripId}`
  if (localStorage.getItem(localKey)) return { ok: false, reason: 'already-voted' as const }

  if (supabase) {
    const { error } = await supabase.from('trip_votes').insert({
      trip_id: tripId,
      month,
      duration,
      voter_key: voterKey,
    })
    if (error) return { ok: false, reason: 'database' as const, message: error.message }
  }

  localStorage.setItem(localKey, '1')
  return { ok: true as const }
}

export async function submitSuggestion(input: { month: number; duration: string; itinerary: string }) {
  if (!supabase) return { ok: false, reason: 'not-configured' as const }
  const { error } = await supabase.from('trip_suggestions').insert(input)
  return error ? { ok: false, reason: 'database' as const, message: error.message } : { ok: true as const }
}
