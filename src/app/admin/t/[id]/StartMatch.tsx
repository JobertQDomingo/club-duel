'use client'

import { useFormStatus } from 'react-dom'
import { FormError, useResult } from '@/components/ActionResult'
import { Button } from '@/components/ui/Button'
import { field } from '@/components/ui/field'
import { startMatch } from './actions'

// Disabled while saving so a slow tap isn't sent twice ("Match N has already started").
function Submit() {
  const { pending } = useFormStatus()
  return <Button type="submit" disabled={pending}>{pending ? 'Starting…' : 'Start match'}</Button>
}

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
      {/* stacked: side by side, a quarter-width court card cut "Match 3" off */}
      <div className="flex flex-col gap-2">
        <select name="match" defaultValue={pending[0].id} aria-label={`Match for ${court.name}`} className={`${field} w-full`}>
          {pending.map((m) => (
            <option key={m.id} value={m.id}>Match {m.slot}</option>
          ))}
        </select>
        <Submit />
      </div>
      <FormError error={error} />
    </form>
  )
}
