import { supabase, type TransportMode } from './supabase'

export type RegistrationRow = {
  id: string
  participant_name: string
  adult_count: number
  child_count: number
  transport_mode: TransportMode | null
  created_at: string
  updated_at: string | null
}

export function summarizeRegistrations(rows: RegistrationRow[]) {
  const counts = () => ({ registrations: 0, adults: 0, children: 0, total: 0 })
  const summary = { all: counts(), bus: counts(), self_drive: counts(), pending: counts() }
  for (const row of rows) {
    const group = row.transport_mode === 'bus' || row.transport_mode === 'self_drive' ? row.transport_mode : 'pending'
    for (const bucket of [summary.all, summary[group]]) {
      bucket.registrations += 1
      bucket.adults += row.adult_count
      bucket.children += row.child_count
      bucket.total += row.adult_count + row.child_count
    }
  }
  return summary
}

export async function loadRegistrationStats(password: string) {
  if (!supabase) return { ok: false as const, reason: 'not-configured' as const }
  const { data, error } = await supabase.rpc('get_retreat_registration_stats', { p_admin_password: password.trim() })
  if (error) {
    if (error.code === '42501') return { ok: false as const, reason: error.message === 'Invalid admin password' ? 'denied' as const : 'permission' as const }
    return { ok: false as const, reason: 'database' as const }
  }
  if (!Array.isArray(data)) return { ok: false as const, reason: 'database' as const }
  return { ok: true as const, rows: data as RegistrationRow[] }
}
