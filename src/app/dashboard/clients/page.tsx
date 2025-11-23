import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Search, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ClientCard } from '@/components/clients/client-card'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { search?: string }
}) {
  const supabase = await createClient()
  const search = searchParams.search || ''

  let query = supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`company_name.ilike.%${search}%,industry.ilike.%${search}%`)
  }

  const { data: clients, error } = await query

  if (error) {
    console.error('Error fetching clients:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion Clients</h1>
          <p className="text-muted-foreground">
            Gérez votre base de données clients - la source unique de vérité
          </p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button className="transition-all duration-200 hover:scale-105 active:scale-95">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un client
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-xs uppercase text-muted-foreground">Tous les clients</CardTitle>
          <CardDescription>
            {clients?.length || 0} client{(clients?.length || 0) !== 1 ? 's' : ''} dans la base de données
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <form action="/dashboard/clients" method="get">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Rechercher des clients par nom ou secteur..."
                  defaultValue={search}
                  className="pl-10"
                />
              </div>
            </form>
          </div>

          {!clients || clients.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">Aucun client pour le moment</p>
              <Link href="/dashboard/clients/new">
                <Button className="transition-all duration-200 hover:scale-105 active:scale-95">
                  Créer un client
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {clients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
