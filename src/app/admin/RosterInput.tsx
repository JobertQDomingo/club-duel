'use client'

import { useRef, useState, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { MAX_NAME } from '@/lib/domain'
import type { Player } from '@/lib/types'

type Entry = Pick<Player, 'name' | 'gender'>

const field = 'min-h-11 border border-ink bg-sheet px-3 font-sans text-base font-normal normal-case tracking-normal'

/** Name + gender + Add, building a list. Submits as `field` (default `players{side}`) in the "Name, M" line format parseRoster reads. */
export function RosterInput({ side, field: fieldName = `players${side}`, legend = `Club ${side} players` }: { side: 'A' | 'B'; field?: string; legend?: string }) {
  const [players, setPlayers] = useState<Entry[]>([])
  const [name, setName] = useState('')
  const [gender, setGender] = useState<Entry['gender'] | ''>('')
  const nameRef = useRef<HTMLInputElement>(null)
  const canAdd = name.trim() !== '' && gender !== ''

  function add() {
    if (!canAdd) return
    setPlayers((p) => [...p, { name: name.trim(), gender }])
    setName('')
    setGender('')
    nameRef.current?.focus()
  }
  // Enter adds the player instead of submitting the whole form.
  function onEnter(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      add()
    }
  }

  return (
    <fieldset className="@container flex min-w-0 flex-col gap-2">
      <legend className="font-display text-sm font-bold uppercase tracking-wide">
        {legend} ({players.length})
      </legend>
      <input type="hidden" name={fieldName} value={players.map((p) => `${p.name}, ${p.gender}`).join('\n')} />
      {/* under 384px the name gets its own line; gender + Add go below it */}
      <div className="flex flex-wrap gap-2">
        <input
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onEnter}
          maxLength={MAX_NAME}
          placeholder="Player name"
          aria-label={`Club ${side} player name`}
          className={`${field} min-w-0 flex-1 basis-full @sm:basis-0`}
        />
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as Entry['gender'] | '')}
          onKeyDown={onEnter}
          aria-label={`Club ${side} player gender`}
          className={field}
        >
          <option value="" disabled>Gender</option>
          <option value="M">M</option>
          <option value="F">F</option>
        </select>
        <Button variant="secondary" onClick={add} disabled={!canAdd}>
          Add
        </Button>
      </div>
      {players.length > 0 && (
        <ol className="divide-y divide-ink/20 border border-ink/20">
          {players.map((p, i) => (
            <li key={i} className="flex min-h-11 items-center justify-between gap-2 px-3">
              <span>
                {i + 1}. {p.name} <span className="text-ink-soft">· {p.gender}</span>
              </span>
              <Button
                variant="ghost"
                onClick={() => setPlayers((all) => all.filter((_, j) => j !== i))}
                aria-label={`Remove ${p.name}`}
              >
                Remove
              </Button>
            </li>
          ))}
        </ol>
      )}
    </fieldset>
  )
}
