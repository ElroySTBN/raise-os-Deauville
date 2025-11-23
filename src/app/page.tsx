import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  // If no user, show a landing page with login button
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="mb-8 text-4xl font-bold">RaiseMed OS</h1>
      <p className="mb-4 text-muted-foreground">
        Internal SaaS/ERP for managing Google Business Profile optimization
      </p>
      <p className="mb-8 text-sm text-muted-foreground">
        Connectez-vous pour accéder au dashboard
      </p>
      <Link href="/login">
        <Button size="lg">Se connecter</Button>
      </Link>
    </div>
  )
}
