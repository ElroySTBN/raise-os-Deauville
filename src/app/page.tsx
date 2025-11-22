import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  // If no user, show a simple landing page
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="mb-8 text-4xl font-bold">RaiseMed OS</h1>
      <p className="mb-4 text-muted-foreground">
        Internal SaaS/ERP for managing Google Business Profile optimization
      </p>
      <p className="text-sm text-muted-foreground">
        Please sign in to access the dashboard
      </p>
    </div>
  )
}
