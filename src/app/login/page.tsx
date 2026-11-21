import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { supabaseServer } from '@/lib/supabase/server'
import { LoginForm } from './LoginForm'

export const metadata = { title: 'Sign in · Club Duel' }
export const instant = false // reads the session cookie

export default async function LoginPage() {
  const { data } = await (await supabaseServer()).auth.getClaims()
  if (data?.claims) redirect('/admin')
  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <h1 className="mb-6 font-display text-4xl font-extrabold uppercase leading-tight">Club Duel</h1>
      <Card title="Admin sign in">
        <LoginForm />
      </Card>
    </main>
  )
}
