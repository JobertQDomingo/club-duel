import { Button } from '@/components/ui/Button'
import { requireUser } from '@/lib/auth'
import { signOut } from '@/app/login/actions'

// Private, per-request pages: block on the session check rather than stream a static shell.
export const instant = false

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  await requireUser()
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-4 bg-sheet px-4">
        <span className="font-display text-xl font-extrabold uppercase">Club Duel · Admin</span>
        <form action={signOut}>
          <Button type="submit" variant="ghost">Sign out</Button>
        </form>
      </header>
      {children}
    </div>
  )
}
