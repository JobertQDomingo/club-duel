'use client'

import { useRef } from 'react'
import { FormError, useResult } from '@/components/ActionResult'
import { Button } from '@/components/ui/Button'
import { field } from '@/components/ui/field'

type Props = {
  action: (form: FormData) => Promise<string | undefined>
  clubs: [string, string] // Club A, Club B names
  score?: [number, number]
  submit: string
  onDone?: () => void
}

/** Club A and Club B scores side by side; the action validates them (whole, ≥ 0, not equal). */
export function ScoreForm({ action, clubs, score, submit, onDone }: Props) {
  const [error, wrap] = useResult(onDone)
  return (
    <form action={wrap(action)} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        {clubs.map((name, i) => (
          <label key={i} className="flex min-w-0 flex-1 basis-24 flex-col gap-1 text-sm font-semibold wrap-anywhere">
            {name}
            <input
              name={i ? 'b' : 'a'}
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              required
              defaultValue={score?.[i]}
              className={`${field} w-full text-lg font-semibold tabular-nums`}
            />
          </label>
        ))}
        <Button type="submit">{submit}</Button>
      </div>
      <FormError error={error} />
    </form>
  )
}

/** Live-court button that opens score entry; closing on success frees the court via refresh. */
export function EndMatch({ slot, ...props }: Omit<Props, 'submit' | 'onDone'> & { slot: number }) {
  const dialog = useRef<HTMLDialogElement>(null)
  return (
    <>
      <Button variant="secondary" onClick={() => dialog.current?.showModal()}>End match {slot}</Button>
      <dialog ref={dialog} aria-label={`Match ${slot} score`} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-card p-5 text-ink shadow-[0_12px_40px_rgb(17_24_39/0.22)] backdrop:bg-ink/40">
        <div className="flex flex-col gap-3">
          <h3 className="text-xl font-bold tracking-tight">Match {slot} score</h3>
          <ScoreForm {...props} submit="Save score" onDone={() => dialog.current?.close()} />
          {/* after the form, so showModal focuses the first score field */}
          <Button variant="ghost" className="self-start" onClick={() => dialog.current?.close()}>Cancel</Button>
        </div>
      </dialog>
    </>
  )
}
