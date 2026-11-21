import 'server-only'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Tell every open view of this tournament to refetch. No data rides along, so nothing can leak.
// Call after a successful write; a failed broadcast only costs a refresh, so it logs instead of throwing.
export async function broadcastChanged(tournamentId: string) {
  const channel = supabaseAdmin.channel(`t:${tournamentId}`)
  try {
    const res = await channel.httpSend('changed', {})
    if (!res.success) console.error('broadcastChanged failed', res.status, res.error)
  } catch (e) {
    console.error('broadcastChanged failed', e)
  } finally {
    await supabaseAdmin.removeChannel(channel)
  }
}
