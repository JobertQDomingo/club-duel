// Event-day load test: page latency, N viewers refreshing at once, realtime fan-out to N phones.
// Run against `next start` or a Vercel deployment (same Supabase as .env.local):
//   npm run perf -- <baseUrl> <tournamentId> [--viewers 100]
// Read-only for app data: it only GETs pages and broadcasts on a throwaway channel.
import { parseArgs } from 'node:util'
import { createClient } from '@supabase/supabase-js'

const { values: opt, positionals: [base, id] } = parseArgs({
  allowPositionals: true,
  options: { viewers: { type: 'string', default: '100' } },
})
const viewers = Number(opt.viewers)
if (!base || !id || !(viewers > 0)) throw new Error('Usage: npm run perf -- <baseUrl> <tournamentId> [--viewers 100]')

const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anon, SUPABASE_SERVICE_ROLE_KEY: service } = process.env
const db = createClient(url, service, { auth: { persistSession: false } })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const stats = (ms) => {
  const s = [...ms].sort((a, b) => a - b)
  const q = (p) => Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))])
  return `p50 ${q(0.5)} ms · p95 ${q(0.95)} ms · max ${q(1)} ms`
}
// RSC: 1 is the request router.refresh() makes when a broadcast arrives (bare ?_rsc skips Next's cache-key redirect)
async function hit(path, rsc = false) {
  const t = performance.now()
  const r = await fetch(base + path + (rsc ? '?_rsc' : ''), { headers: rsc ? { RSC: '1' } : {} })
  const kb = (await r.arrayBuffer()).byteLength / 1024
  if (!r.ok) throw new Error(`${path} → ${r.status}`)
  return { ms: performance.now() - t, kb }
}

const rtt = []
for (let i = 0; i < 5; i++) {
  const t = performance.now()
  await db.from('tournaments').select('id').limit(1)
  rtt.push(performance.now() - t)
}
console.log(`Supabase round trip from this machine: ${stats(rtt)}\n`)

const { data: club, error } = await db.from('clubs').select('captain_token').eq('tournament_id', id).limit(1).single()
if (error) throw new Error(`Tournament ${id}: ${error.message}`)

console.log('Single request, warm (10 in a row)')
for (const [label, path, rsc] of [
  ['audience page   ', `/t/${id}`],
  ['audience refresh', `/t/${id}`, true],
  ['captain page    ', `/c/${club.captain_token}`],
]) {
  await hit(path, rsc) // warm-up
  const runs = []
  for (let i = 0; i < 10; i++) runs.push(await hit(path, rsc))
  console.log(`  ${label}  ${stats(runs.map((r) => r.ms))} · ${runs[0].kb.toFixed(0)} KB`)
}

console.log('\nBurst: every viewer refreshes at the same moment (one score change)')
for (const n of [...new Set([25, 50, viewers])].sort((a, b) => a - b)) {
  const t = performance.now()
  const res = await Promise.allSettled(Array.from({ length: n }, () => hit(`/t/${id}`, true)))
  const ok = res.filter((r) => r.status === 'fulfilled').map((r) => r.value.ms)
  const failed = res.filter((r) => r.status === 'rejected')
  console.log(`  ${String(n).padStart(4)} viewers  ${stats(ok)} · all done in ${Math.round(performance.now() - t)} ms · ${failed.length} failed${failed.length ? ` (${failed[0].reason.message})` : ''}`)
}

console.log(`\nRealtime: ${viewers} phones subscribed`)
const topic = `t:perf-${Date.now()}` // throwaway channel, so no real viewer refreshes
const clients = Array.from({ length: viewers }, () => createClient(url, anon, { auth: { persistSession: false } }))
const t0 = performance.now()
let sentAt = 0
let got = []
const drops = [] // any status after the first SUBSCRIBED = a phone lost its live updates
for (let i = 0; i < clients.length; i += 50) { // phones open the page over time; 100+ joins in one second trips the joins/sec limit
  await Promise.all(clients.slice(i, i + 50).map((c) => new Promise((resolve) => {
    let first = true
    c.channel(topic)
      .on('broadcast', { event: 'changed' }, () => got.push(performance.now() - sentAt))
      .subscribe((s) => {
        if (first) resolve((first = false))
        else if (s !== 'SUBSCRIBED') drops.push(s) // a late SUBSCRIBED is a slow join, not a drop
      })
  })))
  await sleep(1000)
}
const subscribed = clients.filter((c) => c.getChannels()[0]?.state === 'joined').length
console.log(`  ${subscribed}/${viewers} subscribed in ${Math.round(performance.now() - t0)} ms`)
// [label, broadcasts, gap ms]: a lone score change, then both captains picking players at once
for (const [label, count, gap] of [['score changes, 1 every 1.5 s', 5, 1500], ['draft picks, 2 per second', 20, 500]]) {
  got = []
  drops.length = 0
  const send = []
  for (let i = 0; i < count; i++) {
    const ch = db.channel(topic) // same call as broadcastChanged()
    sentAt = performance.now()
    const res = await ch.httpSend('changed', {})
    send.push(performance.now() - sentAt)
    if (!res.success) console.log(`  broadcast failed: ${res.status} ${res.error}`)
    await db.removeChannel(ch)
    await sleep(gap)
  }
  await sleep(1000)
  console.log(`  ${label}: send ${stats(send)} · delivered ${got.length}/${count * subscribed} · ${drops.length} phone disconnects${drops.length ? ` (${[...new Set(drops)]})` : ''}`)
  if (got.length) console.log(`    send → phone ${stats(got)}`)
}
await Promise.all(clients.map((c) => c.removeAllChannels()))
