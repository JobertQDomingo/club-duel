'use client'

import { useState, useTransition } from 'react'
import { FormError } from '@/components/ActionResult'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { LineupPair, Player } from '@/lib/types'

type Props = {
  side: 'A' | 'B'
  slots: number
  players: Player[]
  pairs: LineupPair[]
  repeats: number[]
  editable: boolean
  /** False once the round is locked: a started match can't lose its pair. */
  clearable?: boolean
  /** From `pastPartners`: after the 1st pick, that player's earlier partners are marked (still pickable). */
  partners?: Record<string, Record<string, number[]>>
  save: (slot: number, ids: [string, string] | null) => Promise<string | undefined>
}

/** Pair 1…P of one lineup: tap a slot, pick 2 players (the 2nd pick saves). Shared by the captain draft and the admin round panel. */
export function LineupSlots({ side, slots, players, pairs, repeats, editable, clearable = true, partners = {}, save }: Props) {
  const [open, setOpen] = useState<number | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  const name = new Map(players.map((p) => [p.id, p.name]))
  const bySlot = new Map(pairs.map((p) => [p.slot, p]))
  const usedIn = new Map(pairs.flatMap((p) => [[p.player1_id, p.slot], [p.player2_id, p.slot]] as const))
  const sorted = [...players].sort((a, b) => a.name.localeCompare(b.name))
  const club = side === 'A' ? 'text-club-a' : 'text-club-b'
  const first = picked.length === 1 ? picked[0] : null
  const pastWith = (first && partners[first]) || {}
  const takenBy = (id: string) => {
    const other = usedIn.get(id)
    return other !== undefined && other !== open ? other : undefined
  }
  const warned = sorted.some((pl) => pastWith[pl.id] && takenBy(pl.id) === undefined)

  const close = () => {
    setOpen(null)
    setPicked([])
  }
  const run = (slot: number, ids: [string, string] | null) =>
    startTransition(async () => {
      const e = await save(slot, ids)
      setError(e)
      if (!e) close()
    })
  function toggleSlot(slot: number) {
    if (open === slot) return close()
    const p = bySlot.get(slot)
    setOpen(slot)
    setPicked(p ? [p.player1_id, p.player2_id] : [])
    setError(undefined)
  }
  function pick(id: string) {
    if (open === null) return
    const next = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]
    setPicked(next)
    if (next.length === 2) run(open, [next[0], next[1]])
  }

  return (
    <div className="flex flex-col gap-3">
      <ol className="divide-y divide-ink/20 border-y border-ink">
        {Array.from({ length: slots }, (_, i) => i + 1).map((slot) => {
          const p = bySlot.get(slot)
          const label = (
            <>
              <span className={`font-display text-sm font-bold uppercase tracking-wide ${club}`}>Pair {slot}</span>
              <span className={p ? '' : 'text-ink-soft'}>
                {p ? `${name.get(p.player1_id)} & ${name.get(p.player2_id)}` : editable ? 'Tap to pick 2 players' : 'Empty'}
              </span>
              {repeats.includes(slot) && <Badge tone="warn" />}
            </>
          )
          return (
            <li key={slot}>
              {editable ? (
                <button
                  type="button"
                  aria-expanded={open === slot}
                  onClick={() => toggleSlot(slot)}
                  className="flex min-h-14 w-full flex-col items-start gap-0.5 px-1 py-2 text-left hover:bg-wall aria-expanded:bg-wall"
                >
                  {label}
                </button>
              ) : (
                <div className="flex min-h-14 flex-col items-start gap-0.5 px-1 py-2">{label}</div>
              )}

              {editable && open === slot && (
                <div className="flex flex-col gap-2 px-1 pb-3">
                  <p className="font-display text-sm font-bold uppercase tracking-wide">
                    Pick 2 players · {picked.length} of 2
                  </p>
                  {first && warned && (
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Badge tone="warn">Already paired</Badge>
                      <span>{name.get(first)} already played with the players marked orange. You can still pick them.</span>
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {sorted.map((pl) => {
                      const other = takenBy(pl.id)
                      const taken = other !== undefined
                      const rounds = !taken && pastWith[pl.id]
                      return (
                        <button
                          key={pl.id}
                          type="button"
                          aria-pressed={picked.includes(pl.id)}
                          disabled={taken || pending}
                          onClick={() => pick(pl.id)}
                          className={`flex min-h-11 flex-col items-start justify-center gap-1 border border-ink px-2 py-1 text-left hover:bg-wall aria-pressed:bg-ink aria-pressed:text-sheet disabled:cursor-not-allowed disabled:border-ink/30 disabled:text-ink/40 ${rounds ? 'bg-warn/25' : ''}`}
                        >
                          <span>
                            {pl.name} <span className="text-sm">· {pl.gender}</span>
                          </span>
                          {taken && <span className="text-sm">In pair {other}</span>}
                          {rounds && <Badge tone="warn">{rounds.length > 1 ? 'Rounds' : 'Round'} {rounds.join(', ')}</Badge>}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex gap-4">
                    {p && clearable && (
                      <Button variant="ghost" disabled={pending} onClick={() => run(slot, null)}>
                        Clear pair
                      </Button>
                    )}
                    <Button variant="ghost" onClick={close}>
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ol>
      <FormError error={error} />
    </div>
  )
}
