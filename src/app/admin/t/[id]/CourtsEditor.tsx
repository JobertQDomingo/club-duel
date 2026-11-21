'use client'

import { FormError, useResult } from '@/components/ActionResult'
import { field } from '@/components/RosterEditor'
import { Button } from '@/components/ui/Button'
import type { Court } from '@/lib/types'
import { addCourt, removeCourt, renameCourt, setPairsPerRound } from './actions'

const label = 'font-display text-sm font-bold uppercase tracking-wide'

/** Admin-only: courts list (add, rename, remove) and pairs per round. */
export function CourtsEditor({ tournamentId, courts, pairs }: { tournamentId: string; courts: Court[]; pairs: number }) {
  const [pairsError, wrapPairs] = useResult()
  const [addError, wrapAdd] = useResult()
  const sorted = [...courts].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

  return (
    <div className="flex flex-col gap-4">
      <form action={wrapPairs((f) => setPairsPerRound(tournamentId, f))} className="flex flex-col gap-2">
        <label className={label} htmlFor="pairs">Pairs per round (next rounds)</label>
        <div className="flex gap-2">
          <input id="pairs" name="pairs" type="number" min={1} max={50} defaultValue={pairs} required className={`${field} w-24`} />
          <Button type="submit" variant="secondary">Save</Button>
        </div>
        <FormError error={pairsError} />
      </form>

      <div className="flex flex-col gap-2">
        <h3 className={label}>Courts ({courts.length})</h3>
        <ol className="divide-y divide-ink/20 border border-ink/20">
          {sorted.map((c) => (
            <CourtRow key={c.id} tournamentId={tournamentId} court={c} />
          ))}
        </ol>
      </div>

      <form action={wrapAdd((f) => addCourt(tournamentId, f))} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input name="name" placeholder="Court name" aria-label="New court name" required className={`${field} min-w-0 flex-1`} />
          <Button type="submit" variant="secondary">Add court</Button>
        </div>
        <FormError error={addError} />
      </form>
    </div>
  )
}

function CourtRow({ tournamentId, court }: { tournamentId: string; court: Court }) {
  const [error, wrap] = useResult()
  const remove = async () => {
    if (!confirm(`Remove ${court.name}?`)) return undefined
    return removeCourt(tournamentId, court.id)
  }
  return (
    <li className="flex flex-col gap-1 px-3 py-2">
      <form action={wrap((f) => renameCourt(tournamentId, court.id, f))} className="flex flex-wrap items-center gap-2">
        <input name="name" defaultValue={court.name} required aria-label="Court name" className={`${field} min-w-0 flex-1`} />
        <Button type="submit" variant="secondary">Save</Button>
        <Button type="submit" variant="ghost" formAction={wrap(remove)} formNoValidate>
          Remove
        </Button>
      </form>
      <FormError error={error} />
    </li>
  )
}
