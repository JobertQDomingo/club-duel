'use client'

import { useState, useTransition } from 'react'
import { FormError } from '@/components/ActionResult'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { saveSlot, submitLineup, unsubmitLineup } from '@/lib/lineup-actions'
import type { LineupPair, Player } from '@/lib/types'

type Props = {
  token: string
  side: 'A' | 'B'
  slots: number
  players: Player[]
  pairs: LineupPair[]
  repeats: number[]
  submitted: boolean
  locked: boolean
  opponent: { name: string; submitted: boolean }
}

/** The captain's lineup for the current round: tap a slot, pick 2 players (the 2nd pick saves). */
export function Draft({ token, side, slots, players, pairs, repeats, submitted, locked, opponent }: Props) {
  const [open, setOpen] = useState<number | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  const name = new Map(players.map((p) => [p.id, p.name]))
  const bySlot = new Map(pairs.map((p) => [p.slot, p]))
  const usedIn = new Map(pairs.flatMap((p) => [[p.player1_id, p.slot], [p.player2_id, p.slot]] as const))
  const editable = !submitted && !locked
  const sorted = [...players].sort((a, b) => a.name.localeCompare(b.name))
  const club = side === 'A' ? 'text-club-a' : 'text-club-b'

  const run = (action: () => Promise<string | undefined>, onDone?: () => void) =>
    startTransition(async () => {
      const e = await action()
      setError(e)
      if (!e) onDone?.()
    })
  const close = () => {
    setOpen(null)
    setPicked([])
  }
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
    if (next.length === 2) run(() => saveSlot(token, open, [next[0], next[1]]), close)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge mark={submitted ? 'filled' : 'hollow'}>You: {submitted ? 'submitted' : 'not yet'}</Badge>
        <Badge mark={opponent.submitted ? 'filled' : 'hollow'}>
          {opponent.name}: {opponent.submitted ? 'submitted' : 'not yet'}
        </Badge>
      </div>
      {locked && <p className="font-semibold">Locked. Both lineups are in; pairs are revealed as matches start.</p>}

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
                  <div className="grid grid-cols-2 gap-2">
                    {sorted.map((pl) => {
                      const other = usedIn.get(pl.id)
                      const taken = other !== undefined && other !== slot
                      return (
                        <button
                          key={pl.id}
                          type="button"
                          aria-pressed={picked.includes(pl.id)}
                          disabled={taken || pending}
                          onClick={() => pick(pl.id)}
                          className="flex min-h-11 flex-col items-start justify-center border border-ink px-2 py-1 text-left hover:bg-wall aria-pressed:bg-ink aria-pressed:text-sheet disabled:cursor-not-allowed disabled:border-ink/30 disabled:text-ink/40"
                        >
                          <span>
                            {pl.name} <span className="text-sm">· {pl.gender}</span>
                          </span>
                          {taken && <span className="text-sm">In pair {other}</span>}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex gap-4">
                    {p && (
                      <Button variant="ghost" disabled={pending} onClick={() => run(() => saveSlot(token, slot, null), close)}>
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
      {!locked &&
        (submitted ? (
          <div className="flex flex-col gap-2">
            <p className="text-ink-soft">Waiting for {opponent.name}. You can unsubmit until they submit.</p>
            <Button variant="secondary" disabled={pending} onClick={() => run(() => unsubmitLineup(token))} className="self-start">
              Unsubmit
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-ink-soft">
              {pairs.length} of {slots} pairs filled.
            </p>
            <Button disabled={pending || pairs.length < slots} onClick={() => run(() => submitLineup(token))} className="self-start">
              Submit lineup
            </Button>
          </div>
        ))}
    </div>
  )
}
