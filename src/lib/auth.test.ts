import { beforeEach, expect, test, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/navigation', () => ({
  redirect: (to: string) => { throw new Error(`redirect:${to}`) },
  notFound: () => { throw new Error('notFound') },
}))
const auth = { sub: undefined as string | undefined, owner: undefined as string | undefined }
vi.mock('@/lib/supabase/server', () => ({
  supabaseServer: async () => ({
    auth: { getClaims: async () => ({ data: auth.sub ? { claims: { sub: auth.sub } } : null }) },
  }),
}))
vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: () => ({ select: () => ({ eq: () => ({
      maybeSingle: async () => ({ data: auth.owner ? { admin_id: auth.owner } : null, error: null }),
    }) }) }),
  },
}))

const { requireAdmin } = await import('./auth')
beforeEach(() => { auth.sub = undefined; auth.owner = undefined })

test('signed out → /login', async () => {
  await expect(requireAdmin('t1')).rejects.toThrow('redirect:/login')
})

test('another admin’s tournament → 404', async () => {
  auth.sub = 'u1'; auth.owner = 'u2'
  await expect(requireAdmin('t1')).rejects.toThrow('notFound')
})

test('unknown tournament → 404', async () => {
  auth.sub = 'u1'
  await expect(requireAdmin('t1')).rejects.toThrow('notFound')
})

test('owner → user id', async () => {
  auth.sub = 'u1'; auth.owner = 'u1'
  await expect(requireAdmin('t1')).resolves.toBe('u1')
})
