import 'server-only'
import { refresh } from 'next/cache'
import { after } from 'next/server'
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

/** End of a successful server action: refresh this view, then tell the others once the response is out. Resolves to undefined (no error), so actions can `return error ? error.message : changed(id)`. */
export async function changed(tournamentId: string): Promise<undefined> {
  // Sent now, in parallel with this view's re-render; after() keeps the function alive until it lands.
  const sent = broadcastChanged(tournamentId)
  after(() => sent)
  refresh()
  return undefined
}
