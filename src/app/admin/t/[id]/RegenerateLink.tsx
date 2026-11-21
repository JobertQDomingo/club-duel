'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { regenerateCaptainLink } from './actions'

export function RegenerateLink({ tournamentId, clubId, clubName }: { tournamentId: string; clubId: string; clubName: string }) {
  const [pending, start] = useTransition()
  function onClick() {
    if (!confirm(`Make a new ${clubName} captain link? The current link stops working.`)) return
    start(() => regenerateCaptainLink(tournamentId, clubId))
  }
  return (
    <Button variant="ghost" onClick={onClick} disabled={pending} className="self-start">
      {pending ? 'Regenerating…' : 'Regenerate link'}
    </Button>
  )
}
