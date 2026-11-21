'use server'

import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'

export type LoginState = { error?: string; info?: string; email?: string } | undefined

export async function authenticate(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get('email') ?? '').trim()
  const password = String(form.get('password') ?? '')
  if (!email || !password) return { error: 'Enter your email and password.', email }

  const auth = (await supabaseServer()).auth
  if (form.get('mode') === 'signup') {
    if (password.length < 6) return { error: 'Use at least 6 characters for the password.', email }
    const { data, error } = await auth.signUp({ email, password })
    if (error) return { error: error.message, email }
    // With "Confirm email" on, Supabase returns no session until the link is clicked.
    if (!data.session) return { info: 'Check your email to confirm, then sign in.', email }
  } else {
    const { error } = await auth.signInWithPassword({ email, password })
    if (error) return { error: error.message, email }
  }
  redirect('/admin')
}

export async function signOut() {
  await (await supabaseServer()).auth.signOut()
  redirect('/login')
}
