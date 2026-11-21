import { redirect } from 'next/navigation'

// Captains and audience arrive by their own links; `/` is the admin's entry (proxy bounces signed-out → /login).
export default function Home() {
  redirect('/admin')
}
