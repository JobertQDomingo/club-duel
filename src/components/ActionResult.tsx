'use client'

import { useState } from 'react'

type Action = (form: FormData) => Promise<string | undefined>

/** Error state for forms whose server action returns an error message or undefined. `onDone` runs on success. */
export function useResult(onDone?: () => void) {
  const [error, setError] = useState<string>()
  const wrap = (action: Action) => async (form: FormData) => {
    const e = await action(form)
    setError(e)
    if (!e) onDone?.()
  }
  return [error, wrap] as const
}

export function FormError({ error }: { error?: string }) {
  if (!error) return null
  return (
    <p role="alert" className="flex items-start gap-2 rounded-xl bg-ink/[0.06] px-3 py-2 font-semibold">
      <svg aria-hidden viewBox="0 0 16 16" className="mt-1 size-4 flex-none" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <circle cx="8" cy="8" r="6.25" />
        <path d="M8 4.75v3.75M8 11v.25" />
      </svg>
      {error}
    </p>
  )
}
