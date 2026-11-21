'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { supabaseBrowser } from '@/lib/supabase/browser'

// Refetches the server-rendered (already filtered) view when broadcastChanged fires for this tournament.
export function LiveRefresh({ tournamentId }: { tournamentId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = supabaseBrowser()
    let timer: ReturnType<typeof setTimeout> | undefined
    const channel = supabase
      .channel(`t:${tournamentId}`)
      .on('broadcast', { event: 'changed' }, () => {
        clearTimeout(timer)
        timer = setTimeout(() => router.refresh(), 300) // collapse bursts of writes into one refetch
      })
      .subscribe()
    return () => {
      clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [tournamentId, router])

  return null
}
