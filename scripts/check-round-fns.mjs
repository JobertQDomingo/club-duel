// Integration check for supabase/migrations/0002_round_fns.sql + 0003_start_match.sql against the real DB.
// Run: node --env-file=.env.local scripts/check-round-fns.mjs
// Creates a throwaway tournament (owned by the first auth user) and deletes it at the end.
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})
const P = 3
const must = ({ data, error }) => {
  if (error) throw new Error(error.message)
  return data
}
const rpc = (fn, args) => db.rpc(fn, args)
const fails = async (fn, args, pattern) => {
  const { error } = await rpc(fn, args)
  assert.ok(error, `${fn} should fail`)
  assert.match(error.message, pattern)
}

const { users } = must(await db.auth.admin.listUsers({ perPage: 1 }))
const t = must(await db.from('tournaments').insert({ admin_id: users[0].id, name: 'T14 check', pairs_per_round: P }).select().single())
try {
  const clubs = must(await db.from('clubs').insert([{ tournament_id: t.id, side: 'A', name: 'A' }, { tournament_id: t.id, side: 'B', name: 'B' }]).select())
  const roster = {}
  for (const c of clubs) {
    const rows = Array.from({ length: 2 * P }, (_, i) => ({ club_id: c.id, name: `${c.side}${i}`, gender: 'M' }))
    roster[c.id] = must(await db.from('players').insert(rows).select('id')).map((p) => p.id).sort()
  }

  // anon must not be able to call the functions
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  assert.ok((await anon.rpc('open_round', { p_tournament_id: t.id })).error, 'anon open_round should fail')

  const roundId = must(await rpc('open_round', { p_tournament_id: t.id }))
  assert.equal(must(await db.from('tournaments').select('status').eq('id', t.id).single()).status, 'active')
  await fails('open_round', { p_tournament_id: t.id }, /Round 1 is not finished/)

  const lineups = must(await db.from('lineups').select().eq('round_id', roundId))
  assert.equal(lineups.length, 2)
  const [la, lb] = lineups

  await fails('submit_lineup', { p_lineup_id: la.id }, /Fill all 3 pairs/)

  // duplicate player blocked
  const ids = roster[la.club_id]
  must(await db.from('lineup_pairs').insert([
    { lineup_id: la.id, slot: 1, player1_id: ids[0], player2_id: ids[1] },
    { lineup_id: la.id, slot: 2, player1_id: ids[0], player2_id: ids[2] },
    { lineup_id: la.id, slot: 3, player1_id: ids[3], player2_id: ids[4] },
  ]))
  await fails('submit_lineup', { p_lineup_id: la.id }, /used twice/)
  must(await db.from('lineup_pairs').delete().eq('lineup_id', la.id))

  for (const l of lineups) {
    const p = roster[l.club_id]
    must(await db.from('lineup_pairs').insert(
      Array.from({ length: P }, (_, k) => ({ lineup_id: l.id, slot: k + 1, player1_id: p[2 * k], player2_id: p[2 * k + 1] })),
    ))
  }

  // submit, unsubmit, then race: A, B and a duplicate A at the same time
  assert.equal(must(await rpc('submit_lineup', { p_lineup_id: la.id })), false)
  must(await rpc('unsubmit_lineup', { p_lineup_id: la.id }))
  const results = await Promise.all([la.id, lb.id, la.id].map((id) => rpc('submit_lineup', { p_lineup_id: id })))
  const locks = results.filter((r) => r.data === true).length
  assert.equal(locks, 1, `exactly 1 lock, got ${JSON.stringify(results)}`)
  for (const r of results) if (r.error) assert.match(r.error.message, /already locked/)

  const round = must(await db.from('rounds').select().eq('id', roundId).single())
  assert.ok(round.locked_at, 'round locked')
  const matches = must(await db.from('matches').select('slot').eq('round_id', roundId))
  assert.deepEqual(matches.map((m) => m.slot).sort(), [1, 2, 3])

  await fails('unsubmit_lineup', { p_lineup_id: lb.id }, /Round is locked/)
  await fails('open_round', { p_tournament_id: t.id }, /Round 1 is not finished/)

  // start_match (0003): busy court, double start, foreign court, concurrent starts on one court
  const [c1, c2] = must(await db.from('courts').insert([{ tournament_id: t.id, name: 'C1' }, { tournament_id: t.id, name: 'C2' }]).select())
  const m = Object.fromEntries(must(await db.from('matches').select('id, slot').eq('round_id', roundId)).map((x) => [x.slot, x.id]))
  assert.ok((await anon.rpc('start_match', { p_match_id: m[3], p_court_id: c1.id })).error, 'anon start_match should fail')
  must(await rpc('start_match', { p_match_id: m[3], p_court_id: c1.id }))
  const live = must(await db.from('matches').select().eq('id', m[3]).single())
  assert.equal(live.status, 'live')
  assert.equal(live.court_id, c1.id)
  assert.ok(live.started_at)
  await fails('start_match', { p_match_id: m[1], p_court_id: c1.id }, /Court is busy/)
  await fails('start_match', { p_match_id: m[3], p_court_id: c2.id }, /Match 3 has already started/)
  const other = must(await db.from('courts').select('id').neq('tournament_id', t.id).limit(1))
  if (other[0]) await fails('start_match', { p_match_id: m[1], p_court_id: other[0].id }, /Court not found/)
  const starts = await Promise.all([m[1], m[2]].map((id) => rpc('start_match', { p_match_id: id, p_court_id: c2.id })))
  assert.equal(starts.filter((r) => !r.error).length, 1, `exactly 1 start on C2, got ${JSON.stringify(starts)}`)
  for (const r of starts) if (r.error) assert.match(r.error.message, /Court is busy/)

  // all done → round 2 opens with the current pairs_per_round
  must(await db.from('matches').update({ status: 'done', score_a: 11, score_b: 5 }).eq('round_id', roundId))
  must(await db.from('tournaments').update({ pairs_per_round: 2 }).eq('id', t.id))
  const r2 = must(await rpc('open_round', { p_tournament_id: t.id }))
  const round2 = must(await db.from('rounds').select().eq('id', r2).single())
  assert.equal(round2.number, 2)
  assert.equal(round2.pairs, 2)

  must(await db.from('tournaments').update({ status: 'ended' }).eq('id', t.id))
  await fails('open_round', { p_tournament_id: t.id }, /has ended/)

  console.log(`OK: 1 lock, ${matches.length} matches, start_match guards, all guards hold`)
} finally {
  // rounds first: players' restrict FK from lineup_pairs blocks the tournament cascade
  must(await db.from('rounds').delete().eq('tournament_id', t.id))
  must(await db.from('tournaments').delete().eq('id', t.id))
}
