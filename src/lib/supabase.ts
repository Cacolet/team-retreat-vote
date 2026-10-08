import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { retreat } from '../data/retreat'

const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined

export const hasSupabase = Boolean(url && anonKey)
export const supabase: SupabaseClient | null = hasSupabase ? createClient(url!, anonKey!) : null

function getRegistrantKey() {
  const storageKey = 'team-retreat-voter-key'
  const saved = localStorage.getItem(storageKey)
  if (saved) return saved
  const key = crypto.randomUUID()
  localStorage.setItem(storageKey, key)
  return key
}

export async function submitRegistration(input: { name: string; adults: number; children: number }) {
  if (!supabase) return { ok: false as const, reason: 'not-configured' as const }
  const { error } = await supabase.from('trip_registrations').insert({
    event_id: retreat.id,
    destination: retreat.destination,
    departure_date: retreat.start,
    return_date: retreat.end,
    participant_name: input.name.trim(),
    adult_count: input.adults,
    child_count: input.children,
    registrant_key: getRegistrantKey(),
  })
  if (!error) return { ok: true as const }
  return error.code === '23505'
    ? { ok: false as const, reason: 'already-registered' as const }
    : { ok: false as const, reason: 'database' as const }
}
