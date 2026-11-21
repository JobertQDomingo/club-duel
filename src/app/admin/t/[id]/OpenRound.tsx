'use client'

import { FormError, useResult } from '@/components/ActionResult'
import { Button } from '@/components/ui/Button'
import { openRound } from './actions'

/** `blocked` is why the round can't open yet (shown under the disabled button), or null. */
export function OpenRound({ tournamentId, number, blocked }: { tournamentId: string; number: number; blocked: string | null }) {
  const [error, wrap] = useResult()
  return (
    <form action={wrap(() => openRound(tournamentId))} className="flex flex-col gap-2">
      <Button type="submit" disabled={!!blocked} className="self-start">
        Open Round {number}
      </Button>
      {blocked && <p className="text-ink-soft">{blocked}</p>}
      <FormError error={error} />
    </form>
  )
}
