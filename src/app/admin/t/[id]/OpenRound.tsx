'use client'

import { FormError, useResult } from '@/components/ActionResult'
import { Button } from '@/components/ui/Button'
import { openRound } from './actions'

export function OpenRound({ tournamentId, number, allowed }: { tournamentId: string; number: number; allowed: boolean }) {
  const [error, wrap] = useResult()
  return (
    <form action={wrap(() => openRound(tournamentId))} className="flex flex-col gap-2">
      <Button type="submit" disabled={!allowed} className="self-start">
        Open Round {number}
      </Button>
      {!allowed && number > 1 && <p className="text-ink-soft">Opens when every match of Round {number - 1} is done.</p>}
      <FormError error={error} />
    </form>
  )
}
