'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/Button'
import { createTournament } from './actions'
import { RosterInput } from './RosterInput'

const label = 'font-display text-sm font-bold uppercase tracking-wide'
const field = 'mt-1 block min-h-11 w-full border border-ink bg-sheet px-3 font-sans text-base font-normal normal-case tracking-normal'

export function NewTournamentForm() {
  const [state, action, pending] = useActionState(createTournament, undefined)
  const v = state?.values ?? {}
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className={label}>
        Tournament name
        <input name="name" required defaultValue={v.name} className={field} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Courts
          <input name="courts" type="number" min={1} max={50} required defaultValue={v.courts ?? 7} className={field} />
        </label>
        <label className={label}>
          Pairs per round
          <input name="pairs" type="number" min={1} max={50} required defaultValue={v.pairs ?? 7} className={field} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {(['A', 'B'] as const).map((side) => (
          <fieldset key={side} className="flex flex-col gap-2">
            <label className={label}>
              Club {side} name
              <input name={`club${side}`} required defaultValue={v[`club${side}`]} className={field} />
            </label>
            <RosterInput side={side} />
          </fieldset>
        ))}
      </div>
      {state?.error && (
        <p role="alert" className="border-l-4 border-ink pl-3 font-semibold">
          {state.error}
        </p>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create tournament'}
        </Button>
      </div>
    </form>
  )
}
