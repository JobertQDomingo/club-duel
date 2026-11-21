'use client'

import { useActionState } from 'react'
import { FormError } from '@/components/ActionResult'
import { Button } from '@/components/ui/Button'
import { MAX_NAME } from '@/lib/domain'
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
        <input name="name" required maxLength={MAX_NAME} defaultValue={v.name} className={field} />
      </label>
      {/* grid-cols-1, not an implicit auto track: an auto track grows to its widest input and scrolls the phone sideways */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={label}>
          Courts
          <input name="courts" type="number" min={1} max={50} required defaultValue={v.courts ?? 4} className={field} />
        </label>
        <label className={label}>
          Pairs per round
          <input name="pairs" type="number" min={1} max={50} required defaultValue={v.pairs ?? 7} className={field} />
        </label>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(['A', 'B'] as const).map((side) => (
          <fieldset key={side} className="flex min-w-0 flex-col gap-2">
            <label className={label}>
              Club {side} name
              <input name={`club${side}`} required maxLength={MAX_NAME} defaultValue={v[`club${side}`]} className={field} />
            </label>
            <RosterInput side={side} />
          </fieldset>
        ))}
      </div>
      <FormError error={state?.error} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create tournament'}
        </Button>
      </div>
    </form>
  )
}
