import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'paused':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Manage your client database - the single source of truth
          </p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>
            {clients?.length || 0} client{(clients?.length || 0) !== 1 ? 's' : ''} in database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <form action="/dashboard/clients" method="get">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search clients by name or industry..."
                  defaultValue={search}
                  className="pl-10"
                />
              </div>
            </form>
          </div>

          {!clients || clients.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No clients found.</p>
              <Link href="/dashboard/clients/new">
                <Button>Add Your First Client</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {clients.map((client) => (
                <Link
                  key={client.id}
                  href={`/dashboard/clients/${client.id}`}
                  className="block"
                >
                  <Card className="hover:bg-accent transition-colors cursor-pointer">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{client.company_name}</h3>
                          <Badge variant={getStatusColor(client.subscription_status)}>
                            {client.subscription_status}
                          </Badge>
                          {client.gbp_connected && (
                            <Badge variant="outline">GBP Connected</Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                          {client.industry && (
                            <span>{client.industry}</span>
                          )}
                          {client.phone && (
                            <span>{client.phone}</span>
                          )}
                          {client.website_url && (
                            <a
                              href={client.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Website
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Created {new Date(client.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
