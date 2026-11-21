'use client'

import { useSyncExternalStore } from 'react'

const hhmm = (iso: string, timeZone?: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone })
const never = () => () => {}

/** HH:MM in the viewer's timezone (the venue's, on the admin's phone). The server renders UTC, then hydration swaps it. */
export function LocalTime({ iso }: { iso: string }) {
  return useSyncExternalStore(never, () => hhmm(iso), () => hhmm(iso, 'UTC'))
}
