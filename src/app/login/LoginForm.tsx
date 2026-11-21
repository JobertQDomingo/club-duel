'use client'

import { useActionState } from 'react'
import { FormError } from '@/components/ActionResult'
import { Button } from '@/components/ui/Button'
import { field as base } from '@/components/ui/field'
import { authenticate } from './actions'

const field = `${base} mt-1.5 block w-full font-normal`

export function LoginForm() {
  const [state, action, pending] = useActionState(authenticate, undefined)
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="text-sm font-semibold">
        Email
        <input name="email" type="email" autoComplete="email" required defaultValue={state?.email} className={field} />
      </label>
      <label className="text-sm font-semibold">
        Password
        <input name="password" type="password" autoComplete="current-password" required className={field} />
      </label>
      <FormError error={state?.error} />
      {state?.info && <p role="status" className="rounded-xl bg-page px-3 py-2">{state.info}</p>}
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
