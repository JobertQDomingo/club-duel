'use server'

import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { parseRoster } from '@/lib/domain'
import { supabaseAdmin as db } from '@/lib/supabase/admin'

export type CreateState = { error: string; values: Record<string, string> } | undefined

const MAX_COURTS = 50
const MAX_PAIRS = 50

export async function createTournament(_prev: CreateState, form: FormData): Promise<CreateState> {
  const adminId = await requireUser()
  const values = Object.fromEntries([...form].map(([k, v]) => [k, String(v)]))
  const fail = (error: string) => ({ error, values })

  const name = values.name?.trim()
  const clubA = values.clubA?.trim()
  const clubB = values.clubB?.trim()
  const courts = Number(values.courts)
  const pairs = Number(values.pairs)
  if (!name || !clubA || !clubB) return fail('Enter the tournament name and both club names.')
  if (!Number.isInteger(courts) || courts < 1 || courts > MAX_COURTS) return fail(`Courts must be a whole number from 1 to ${MAX_COURTS}.`)
  if (!Number.isInteger(pairs) || pairs < 1 || pairs > MAX_PAIRS) return fail(`Pairs per round must be a whole number from 1 to ${MAX_PAIRS}.`)
  const rosterA = parseRoster(values.playersA ?? '')
  if (typeof rosterA === 'string') return fail(`${clubA} players: ${rosterA}`)
  const rosterB = parseRoster(values.playersB ?? '')
  if (typeof rosterB === 'string') return fail(`${clubB} players: ${rosterB}`)

  const t = await db.from('tournaments').insert({ admin_id: adminId, name, pairs_per_round: pairs }).select('id').single()
  if (t.error) return fail(t.error.message)
  const id: string = t.data.id

  // No transaction across REST calls: on any failure, delete the tournament (children cascade).
  const error = await (async () => {
    const clubs = await db
      .from('clubs')
      .insert([{ tournament_id: id, side: 'A', name: clubA }, { tournament_id: id, side: 'B', name: clubB }])
      .select('id, side')
    if (clubs.error) return clubs.error
    const clubId = (side: string) => clubs.data.find((c) => c.side === side)!.id
    const [p, c] = await Promise.all([
      db.from('players').insert([
        ...rosterA.map((pl) => ({ ...pl, club_id: clubId('A') })),
        ...rosterB.map((pl) => ({ ...pl, club_id: clubId('B') })),
      ]),
      db.from('courts').insert(Array.from({ length: courts }, (_, i) => ({ tournament_id: id, name: `Court ${i + 1}` }))),
    ])
    return p.error ?? c.error
  })()
  if (error) {
    await db.from('tournaments').delete().eq('id', id)
    return fail(error.message)
  }
  redirect(`/admin/t/${id}`)
}
