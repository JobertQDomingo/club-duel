'use client'

import { useState, useTransition } from 'react'
import { FormError } from '@/components/ActionResult'
import { LineupSlots } from '@/components/LineupSlots'
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
  partners: Record<string, Record<string, number[]>>
  submitted: boolean
  locked: boolean
  opponent: { name: string; submitted: boolean }
}

/** The captain's lineup for the current round, with Submit/Unsubmit. */
export function Draft({ token, side, slots, players, pairs, repeats, partners, submitted, locked, opponent }: Props) {
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const run = (action: () => Promise<string | undefined>) => startTransition(async () => setError(await action()))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge mark={submitted ? 'filled' : 'hollow'}>You: {submitted ? 'submitted' : 'not yet'}</Badge>
        <Badge mark={opponent.submitted ? 'filled' : 'hollow'}>
          {opponent.name}: {opponent.submitted ? 'submitted' : 'not yet'}
        </Badge>
      </div>
      {locked && <p className="rounded-xl bg-page px-3 py-2 font-semibold">Locked. Both lineups are in; pairs are revealed as matches start.</p>}

      <LineupSlots
        side={side}
        slots={slots}
        players={players}
        pairs={pairs}
        repeats={repeats}
        partners={partners}
        editable={!submitted && !locked}
        save={(slot, ids) => saveSlot(token, slot, ids)}
      />

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
