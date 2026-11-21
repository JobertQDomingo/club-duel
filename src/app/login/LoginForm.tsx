'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/Button'
import { authenticate } from './actions'

const field = 'mt-1 block min-h-11 w-full border border-ink bg-sheet px-3 font-sans text-base font-normal normal-case tracking-normal'

export function LoginForm() {
  const [state, action, pending] = useActionState(authenticate, undefined)
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="font-display text-sm font-bold uppercase tracking-wide">
        Email
        <input name="email" type="email" autoComplete="email" required defaultValue={state?.email} className={field} />
      </label>
      <label className="font-display text-sm font-bold uppercase tracking-wide">
        Password
        <input name="password" type="password" autoComplete="current-password" required className={field} />
      </label>
      {state?.error && (
        <p role="alert" className="border-l-4 border-ink pl-3 font-semibold">
          {state.error}
        </p>
      )}
      {state?.info && <p role="status" className="border-l-4 border-ink pl-3">{state.info}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="mode" value="signin" disabled={pending}>
          Sign in
        </Button>
        <Button type="submit" name="mode" value="signup" variant="secondary" disabled={pending}>
          Create account
        </Button>
      </div>
    </form>
  )
}
