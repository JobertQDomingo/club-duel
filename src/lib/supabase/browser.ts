import { createBrowserClient } from '@supabase/ssr'

// Anon client for auth + realtime subscribe only. RLS blocks table reads.
export const supabaseBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
