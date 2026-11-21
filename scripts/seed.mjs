// Demo tournament for dry runs. Each run creates a new, independent tournament.
// Run: npm run seed -- <admin email> [--a 16] [--b 17] [--courts 4] [--pairs 7] [--rounds 0]
// --rounds N plays N full rounds through the real RPCs (open → submit both → start → done).
import assert from 'node:assert/strict'
import { parseArgs } from 'node:util'
import { createClient } from '@supabase/supabase-js'

const { values: opt, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    a: { type: 'string', default: '16' },
    b: { type: 'string', default: '17' },
    courts: { type: 'string', default: '4' },
    pairs: { type: 'string', default: '7' },
    rounds: { type: 'string', default: '0' },
  },
})
const [email] = positionals
const n = Object.fromEntries(Object.entries(opt).map(([k, v]) => [k, Number(v)]))
const usage = 'Usage: npm run seed -- <admin email> [--a 16] [--b 17] [--courts 4] [--pairs 7] [--rounds 0]'
if (!email) throw new Error(usage)
for (const [k, v] of Object.entries(n)) if (!Number.isInteger(v) || v < (k === 'rounds' ? 0 : 1)) throw new Error(`--${k} must be a whole number. ${usage}`)
// open_round refuses a round a club can't fill
if (Math.min(n.a, n.b) < 2 * n.pairs) throw new Error(`Each club needs at least ${2 * n.pairs} players for ${n.pairs} pairs.`)

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})
const must = ({ data, error }) => {
  if (error) throw new Error(error.message)
  return data
}

// shortcut: scans the first 1000 auth users, page through if the project ever has more
const { users } = must(await db.auth.admin.listUsers({ perPage: 1000 }))
const admin = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
if (!admin) throw new Error(`No user with email ${email}. Sign up at /login first.`)

const stamp = new Date().toISOString().slice(0, 19).replace('T', ' ')
const t = must(await db.from('tournaments').insert({ admin_id: admin.id, name: `Demo ${stamp}`, pairs_per_round: n.pairs }).select().single())
try {
  const clubs = must(await db.from('clubs').insert([
    { tournament_id: t.id, side: 'A', name: 'Club A' },
    { tournament_id: t.id, side: 'B', name: 'Club B' },
  ]).select())
  const roster = {}
  for (const c of clubs) {
    const size = c.side === 'A' ? n.a : n.b
    const rows = Array.from({ length: size }, (_, i) => ({
      club_id: c.id,
      name: `${c.side}${String(i + 1).padStart(2, '0')}`,
      gender: i % 2 ? 'F' : 'M',
    }))
    roster[c.id] = must(await db.from('players').insert(rows).select('id')).map((p) => p.id)
  }
  const courts = must(await db.from('courts').insert(
    Array.from({ length: n.courts }, (_, i) => ({ tournament_id: t.id, name: `Court ${i + 1}` })),
  ).select('id'))

  for (let r = 0; r < n.rounds; r++) {
    const roundId = must(await db.rpc('open_round', { p_tournament_id: t.id }))
    const lineups = must(await db.from('lineups').select().eq('round_id', roundId))
    for (const l of lineups) {
      const p = roster[l.club_id]
      // shift by the round number so no pair repeats (until rounds wrap the roster)
      const pairs = Array.from({ length: n.pairs }, (_, k) => {
        const [p1, p2] = [p[(r + 2 * k) % p.length], p[(r + 2 * k + 1) % p.length]].sort()
        return { lineup_id: l.id, slot: k + 1, player1_id: p1, player2_id: p2 }
      })
      must(await db.from('lineup_pairs').insert(pairs))
      must(await db.rpc('submit_lineup', { p_lineup_id: l.id }))
    }
    const matches = must(await db.from('matches').select('id, slot').eq('round_id', roundId).order('slot'))
    for (const m of matches) {
      must(await db.rpc('start_match', { p_match_id: m.id, p_court_id: courts[(m.slot - 1) % courts.length].id }))
      const lose = Math.floor(Math.random() * 10)
      const [score_a, score_b] = Math.random() < 0.5 ? [11, lose] : [lose, 11]
      must(await db.from('matches').update({ status: 'done', score_a, score_b, ended_at: new Date().toISOString() }).eq('id', m.id))
    }
  }

  const done = must(await db.from('matches').select('id, rounds!inner(tournament_id)').eq('rounds.tournament_id', t.id).eq('status', 'done'))
  assert.equal(done.length, n.rounds * n.pairs, 'every seeded match is done')

  console.log(`Seeded "${t.name}" for ${email}: ${n.a} + ${n.b} players, ${n.courts} courts, ${n.pairs} pairs/round, ${n.rounds} rounds played`)
  console.log(`Admin:     /admin/t/${t.id}`)
  for (const c of clubs) console.log(`Captain ${c.side}: /c/${c.captain_token}`)
  console.log(`Audience:  /t/${t.id}`)
} catch (e) {
  // rounds first: players' restrict FK from lineup_pairs blocks the tournament cascade
  await db.from('rounds').delete().eq('tournament_id', t.id)
  await db.from('tournaments').delete().eq('id', t.id)
  throw e
}
