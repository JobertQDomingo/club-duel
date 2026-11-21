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
    <p role="alert" className="border-l-4 border-ink pl-3 font-semibold">
      {error}
    </p>
  )
}
