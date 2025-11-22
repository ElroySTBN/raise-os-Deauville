import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Edit, ExternalLink } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function ClientPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !client) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{client.company_name}</h1>
            <p className="text-muted-foreground">Client Details</p>
          </div>
        </div>
        <Link href={`/dashboard/clients/${client.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Client
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Company details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Company Name</label>
              <p className="text-sm font-medium">{client.company_name}</p>
            </div>
            {client.industry && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Industry</label>
                <p className="text-sm">{client.industry}</p>
              </div>
            )}
            {client.phone && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone</label>
                <p className="text-sm">{client.phone}</p>
              </div>
            )}
            {client.address && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <p className="text-sm">{client.address}</p>
              </div>
            )}
            {client.website_url && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Website</label>
                <a
                  href={client.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {client.website_url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            {client.google_maps_url && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Google Maps</label>
                <a
                  href={client.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View on Google Maps
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription & Status</CardTitle>
            <CardDescription>Client subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge variant={client.subscription_status === 'active' ? 'default' : 'secondary'}>
                  {client.subscription_status}
                </Badge>
              </div>
            </div>
            {client.subscription_start_date && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                <p className="text-sm">
                  {new Date(client.subscription_start_date).toLocaleDateString()}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Monthly Report Day</label>
              <p className="text-sm">Day {client.monthly_report_day} of each month</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">GBP Connection</label>
              <div className="mt-1">
                {client.gbp_connected ? (
                  <Badge variant="outline">Connected</Badge>
                ) : (
                  <Badge variant="secondary">Not Connected</Badge>
                )}
              </div>
            </div>
            {client.gbp_location_id && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">GBP Location ID</label>
                <p className="text-sm font-mono text-xs">{client.gbp_location_id}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {client.buyer_persona && (
          <Card>
            <CardHeader>
              <CardTitle>Buyer Persona</CardTitle>
              <CardDescription>Target audience information</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">
                {JSON.stringify(client.buyer_persona, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {client.tone_of_voice && (
          <Card>
            <CardHeader>
              <CardTitle>Tone of Voice</CardTitle>
              <CardDescription>Content style guidelines</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">
                {JSON.stringify(client.tone_of_voice, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {client.competitors && Array.isArray(client.competitors) && client.competitors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Competitors</CardTitle>
              <CardDescription>Competitive analysis data</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">
                {JSON.stringify(client.competitors, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {client.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
