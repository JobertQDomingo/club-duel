import { Button } from '@/components/ui/Button'
import { requireUser } from '@/lib/auth'
import { signOut } from '@/app/login/actions'

// Private, per-request pages: block on the session check rather than stream a static shell.
export const instant = false

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  await requireUser()
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-line bg-card px-4">
        <span className="text-lg font-extrabold tracking-tight">
          Club Duel <span className="font-medium text-ink-soft">Admin</span>
        </span>
        <form action={signOut}>
          <Button type="submit" variant="ghost">Sign out</Button>
        </form>
      </header>
      {children}
    </div>
  )
}
