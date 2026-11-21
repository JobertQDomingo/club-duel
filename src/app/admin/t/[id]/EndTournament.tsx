'use client'

import { useRef } from 'react'
import { FormError, useResult } from '@/components/ActionResult'
import { Button } from '@/components/ui/Button'
import { endTournament } from './actions'

type Props = { tournamentId: string; live: boolean; tied: boolean; pending: number }

/** End Tournament with a confirm dialog; disabled while a match is live. */
export function EndTournament({ tournamentId, live, tied, pending }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [error, wrap] = useResult(() => dialog.current?.close())
  return (
    <div className="flex flex-col gap-2">
      <Button variant="secondary" disabled={live} className="self-start" onClick={() => dialog.current?.showModal()}>
        End tournament
      </Button>
      {live && <p className="text-ink-soft">Ends once no match is live.</p>}
      <dialog ref={dialog} aria-label="End tournament" className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-card p-5 text-ink shadow-[0_12px_40px_rgb(17_24_39/0.22)] backdrop:bg-ink/40">
        <form action={wrap(() => endTournament(tournamentId))} className="flex flex-col gap-3">
          <h3 className="text-xl font-bold tracking-tight">End tournament?</h3>
          <p>The audience sees the final result and awards. No more rounds can be opened.</p>
          {tied && <p className="rounded-xl bg-warn-bg px-3 py-2 font-semibold text-warn-ink">Currently tied: ending now makes it a Draw. Open another round for a tiebreaker instead.</p>}
          {pending > 0 && <p>{pending} pending {pending === 1 ? 'match' : 'matches'} won&apos;t count.</p>}
          <FormError error={error} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit">End tournament</Button>
            <Button variant="ghost" onClick={() => dialog.current?.close()}>Cancel</Button>
          </div>
        </form>
      </dialog>
    </div>
  )
}
