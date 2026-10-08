import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined

export const hasSupabase = Boolean(url && anonKey)
export const supabase: SupabaseClient | null = hasSupabase ? createClient(url!, anonKey!) : null

export type TransportMode = 'bus' | 'self_drive'
export type Registration = { name: string; adults: number; children: number; transport: TransportMode | null }

function getRegistrantKey() {
  const storageKey = 'team-retreat-voter-key'
  const saved = localStorage.getItem(storageKey)
  if (saved) return saved
  const key = crypto.randomUUID()
  localStorage.setItem(storageKey, key)
  return key
}

export async function loadRegistration() {
  if (!supabase) return { ok: false as const }
  const key = localStorage.getItem('team-retreat-voter-key')
  if (!key) return { ok: true as const, registration: null }
  const { data, error } = await supabase.rpc('get_retreat_registration', { p_registrant_key: key })
  if (error) return { ok: false as const }
  const registration: Registration | null = data ? {
    name: data.participant_name,
    adults: data.adult_count,
    children: data.child_count,
    transport: data.transport_mode,
  } : null
  return { ok: true as const, registration }
}

export async function submitRegistration(input: { name: string; adults: number; children: number; transport: TransportMode }) {
  if (!supabase) return { ok: false as const, reason: 'not-configured' as const }
  const { error } = await supabase.rpc('save_retreat_registration', {
    p_participant_name: input.name.trim(),
    p_adult_count: input.adults,
    p_child_count: input.children,
    p_transport_mode: input.transport,
    p_registrant_key: getRegistrantKey(),
  })
  if (!error) return { ok: true as const }
  return { ok: false as const, reason: 'database' as const }
}
