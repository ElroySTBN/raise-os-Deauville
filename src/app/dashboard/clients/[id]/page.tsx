import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Edit, ExternalLink } from 'lucide-react'
import { notFound } from 'next/navigation'
import { GenerateMagicLink } from '@/components/clients/generate-magic-link'
import { OnboardingCommandCenter } from '@/components/clients/onboarding-command-center'
import { formatDate } from '@/lib/utils'

export default async function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
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
            <p className="text-muted-foreground">Détails du client</p>
          </div>
        </div>
        <div className="flex gap-2">
          <GenerateMagicLink clientId={client.id} />
          <Link href={`/dashboard/clients/${client.id}/edit`}>
            <Button className="transition-all duration-200 hover:scale-105 active:scale-95">
              <Edit className="mr-2 h-4 w-4" />
              Modifier le client
            </Button>
          </Link>
        </div>
      </div>

      {/* Command Center: Onboarding Tracking */}
      <OnboardingCommandCenter
        clientId={client.id}
        onboardingStatus={client.onboarding_status || 'pending'}
        companyName={client.company_name}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-xs uppercase text-muted-foreground">Informations de base</CardTitle>
            <CardDescription>Détails de l'entreprise et informations de contact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nom de l'entreprise</label>
              <p className="text-sm font-medium">{client.company_name}</p>
            </div>
            {client.industry && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Secteur</label>
                <p className="text-sm">{client.industry}</p>
              </div>
            )}
            {client.phone && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
                <p className="text-sm">{client.phone}</p>
              </div>
            )}
            {client.address && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Adresse</label>
                <p className="text-sm">{client.address}</p>
              </div>
            )}
            {client.website_url && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Site web</label>
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
                  Voir sur Google Maps
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-xs uppercase text-muted-foreground">Abonnement et statut</CardTitle>
            <CardDescription>Détails de l'abonnement client</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Statut</label>
              <div className="mt-1">
                <Badge variant={client.subscription_status === 'active' ? 'default' : 'secondary'}>
                  {client.subscription_status === 'active' ? 'Actif' : client.subscription_status === 'paused' ? 'En pause' : 'Annulé'}
                </Badge>
              </div>
            </div>
            {client.subscription_start_date && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date de début</label>
                <p className="text-sm">
                  {formatDate(client.subscription_start_date)}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Jour du rapport mensuel</label>
              <p className="text-sm">Jour {client.monthly_report_day} de chaque mois</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Connexion GBP</label>
              <div className="mt-1">
                {client.gbp_connected ? (
                  <Badge variant="outline">Connecté</Badge>
                ) : (
                  <Badge variant="secondary">Non connecté</Badge>
                )}
              </div>
            </div>
            {client.gbp_location_id && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">ID d'emplacement GBP</label>
                <p className="text-sm font-mono text-xs">{client.gbp_location_id}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {client.buyer_persona && (
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-muted-foreground">Persona acheteur</CardTitle>
              <CardDescription>Informations sur le public cible</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">
                {JSON.stringify(client.buyer_persona, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {client.tone_of_voice && (
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-muted-foreground">Ton de voix</CardTitle>
              <CardDescription>Lignes directrices du style de contenu</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">
                {JSON.stringify(client.tone_of_voice, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {client.competitors && Array.isArray(client.competitors) && client.competitors.length > 0 && (
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-muted-foreground">Concurrents</CardTitle>
              <CardDescription>Données d'analyse concurrentielle</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">
                {JSON.stringify(client.competitors, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {client.notes && (
          <Card className="md:col-span-2 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-xs uppercase text-muted-foreground">Notes</CardTitle>
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
