'use client'

import { useState } from 'react'
import { RosterInput } from '@/app/admin/RosterInput'
import { FormError, useResult } from '@/components/ActionResult'
import { Button } from '@/components/ui/Button'
import { addPlayers, editPlayer, removePlayer, renameClub, type Caller } from '@/lib/roster-actions'
import type { Club, Player } from '@/lib/types'

export const field = 'min-h-11 border border-ink bg-sheet px-3 text-base'

/** One club's name and roster, editable. Shared by the admin console and the captain page. */
export function RosterEditor({ caller, club, players }: { caller: Caller; club: Pick<Club, 'id' | 'side' | 'name'>; players: Player[] }) {
  const [nameError, wrapName] = useResult()
  const [addKey, setAddKey] = useState(0) // remount RosterInput to clear its list after a successful add
  const [addError, wrapAdd] = useResult(() => setAddKey((k) => k + 1))
  const sorted = [...players].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="flex flex-col gap-4">
      <form action={wrapName((f) => renameClub(caller, club.id, f))} className="flex flex-col gap-2">
        <label className="font-display text-sm font-bold uppercase tracking-wide" htmlFor={`club-${club.id}`}>
          Club {club.side} name
        </label>
        <div className="flex gap-2">
          <input id={`club-${club.id}`} name="name" defaultValue={club.name} required className={`${field} min-w-0 flex-1`} />
          <Button type="submit" variant="secondary">Save</Button>
        </div>
        <FormError error={nameError} />
      </form>

      <ol className="divide-y divide-ink/20 border border-ink/20">
        {sorted.map((p) => (
          // values in the key: remount after a save, since a select ignores a changed defaultValue on form reset
          <PlayerRow key={`${p.id}:${p.name}:${p.gender}`} caller={caller} player={p} />
        ))}
        {sorted.length === 0 && <li className="px-3 py-2 text-ink-soft">No players yet.</li>}
      </ol>

      <form action={wrapAdd((f) => addPlayers(caller, club.id, f))} className="flex flex-col gap-2">
        <RosterInput key={addKey} side={club.side} field="players" legend="New players" />
        <Button type="submit" className="self-start">Save new players</Button>
        <FormError error={addError} />
      </form>
    </div>
  )
}

function PlayerRow({ caller, player }: { caller: Caller; player: Player }) {
  const [error, wrap] = useResult()
  const remove = async () => {
    if (!confirm(`Remove ${player.name}?`)) return undefined
    return removePlayer(caller, player.id)
  }
  return (
    <li className="flex flex-col gap-1 px-3 py-2">
      <form action={wrap((f) => editPlayer(caller, player.id, f))} className="flex flex-wrap items-center gap-2">
        <input name="name" defaultValue={player.name} required aria-label="Player name" className={`${field} min-w-0 flex-1`} />
        <select name="gender" defaultValue={player.gender} aria-label={`${player.name} gender`} className={field}>
          <option value="M">M</option>
          <option value="F">F</option>
        </select>
        <Button type="submit" variant="secondary">Save</Button>
        <Button type="submit" variant="ghost" formAction={wrap(remove)} formNoValidate>
          Remove
        </Button>
      </form>
      <FormError error={error} />
    </li>
  )
}
