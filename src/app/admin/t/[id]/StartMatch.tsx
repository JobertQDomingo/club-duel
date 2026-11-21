'use client'

import { FormError, useResult } from '@/components/ActionResult'
import { field } from '@/components/RosterEditor'
import { Button } from '@/components/ui/Button'
import { startMatch } from './actions'

/** Free-court picker. `pending` is sorted by slot, so the lowest match is the default. */
export function StartMatch({
  tournamentId,
  court,
  pending,
}: {
  tournamentId: string
  court: { id: string; name: string }
  pending: { id: string; slot: number }[]
}) {
  const [error, wrap] = useResult()
  return (
    <form action={wrap(startMatch.bind(null, tournamentId, court.id))} className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <select name="match" defaultValue={pending[0].id} aria-label={`Match for ${court.name}`} className={`${field} flex-1`}>
          {pending.map((m) => (
            <option key={m.id} value={m.id}>Match {m.slot}</option>
          ))}
        </select>
        <Button type="submit">Start</Button>
      </div>
      <FormError error={error} />
    </form>
  )
}
