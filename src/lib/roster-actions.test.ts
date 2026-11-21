import { beforeEach, expect, test, vi } from 'vitest'

// A captain token resolves to club "own"; every query is recorded so we can see its club filter.
vi.mock('server-only', () => ({}))
vi.mock('@/lib/realtime', () => ({ changed: async () => undefined }))
vi.mock('@/lib/auth', () => ({
  requireCaptain: async () => ({ id: 'own', tournament_id: 't1' }),
  requireAdmin: async () => { throw new Error('not admin') },
}))
const calls: string[] = []
const query: Record<string, unknown> = {}
const record = (name: string) => (...args: unknown[]) => (calls.push(`${name} ${JSON.stringify(args)}`), query)
Object.assign(query, {
  update: record('update'),
  delete: record('delete'),
  eq: record('eq'),
  in: record('in'),
  select: record('select'),
  then: (resolve: (r: unknown) => void) => resolve({ data: [{ id: 'p1' }], error: null }), // awaiting the query
})
vi.mock('@/lib/supabase/admin', () => ({ supabaseAdmin: { from: record('from') } }))

const { editPlayer, removePlayer, renameClub } = await import('./roster-actions')
const captain = { token: 'tok' }
const form = (fields: Record<string, string>) => {
  const f = new FormData()
  for (const [k, v] of Object.entries(fields)) f.set(k, v)
  return f
}
beforeEach(() => { calls.length = 0 })

test("a captain can't rename the other club", async () => {
  expect(await renameClub(captain, 'other', form({ name: 'Taken over' }))).toBe('Not your club.')
  expect(calls.some((c) => c.startsWith('update'))).toBe(false)
})

test("a captain's player edit and removal only match their own club's players", async () => {
  expect(await editPlayer(captain, 'p1', form({ name: 'Ana', gender: 'F' }))).toBeUndefined()
  expect(calls).toContain('in ["club_id",["own"]]')
  calls.length = 0
  expect(await removePlayer(captain, 'p1')).toBeUndefined()
  expect(calls).toContain('in ["club_id",["own"]]')
})

test('names over the limit are refused before any write', async () => {
  expect(await renameClub(captain, 'own', form({ name: 'x'.repeat(61) }))).toMatch(/up to 60/)
  expect(calls.some((c) => c.startsWith('update'))).toBe(false)
})
