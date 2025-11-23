'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

interface ClientFormProps {
  client?: {
    id: string
    company_name: string
    industry?: string
    website_url?: string
    phone?: string
    address?: string
    google_maps_url?: string
    gbp_location_id?: string
    gbp_connected?: boolean
    buyer_persona?: any
    tone_of_voice?: any
    competitors?: any
    subscription_start_date?: string
    subscription_status?: string
    monthly_report_day?: number
    notes?: string
  }
}

export function ClientForm({ client }: ClientFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState(
    client?.subscription_status || 'active'
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      company_name: formData.get('company_name') as string,
      industry: formData.get('industry') as string || null,
      website_url: formData.get('website_url') as string || null,
      phone: formData.get('phone') as string || null,
      address: formData.get('address') as string || null,
      google_maps_url: formData.get('google_maps_url') as string || null,
      gbp_location_id: formData.get('gbp_location_id') as string || null,
      subscription_start_date: formData.get('subscription_start_date') as string || null,
      subscription_status: subscriptionStatus,
      monthly_report_day: parseInt(formData.get('monthly_report_day') as string) || 1,
      notes: formData.get('notes') as string || null,
    }

    const supabase = createClient()

    try {
      if (client) {
        // Update existing client
        const { error: updateError } = await supabase
          .from('clients')
          .update(data)
          .eq('id', client.id)

        if (updateError) {
          console.error('Update error:', updateError)
          throw new Error(updateError.message || 'Failed to update client')
        }
        router.push(`/dashboard/clients/${client.id}`)
        router.refresh()
      } else {
        // Create new client
        const { data: newClient, error: insertError } = await supabase
          .from('clients')
          .insert(data)
          .select()
          .single()

        if (insertError) {
          console.error('Insert error:', insertError)
          throw new Error(insertError.message || 'Failed to create client')
        }

        if (!newClient || !newClient.id) {
          throw new Error('Client created but no ID returned')
        }

        router.push(`/dashboard/clients/${newClient.id}`)
        router.refresh()
      }
    } catch (err: any) {
      console.error('Form submission error:', err)
      setError(err.message || 'An error occurred while saving the client')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Card className="border-destructive shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-xs uppercase text-muted-foreground">Informations de base</CardTitle>
          <CardDescription>Détails de l'entreprise et informations de contact</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Nom de l'entreprise *</Label>
            <Input
              id="company_name"
              name="company_name"
              defaultValue={client?.company_name}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Secteur</Label>
            <Input
              id="industry"
              name="industry"
              defaultValue={client?.industry || ''}
              placeholder="ex. : Santé, Restaurant, Services juridiques"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={client?.phone || ''}
                placeholder="+33 1 23 45 67 89"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">URL du site web</Label>
              <Input
                id="website_url"
                name="website_url"
                type="url"
                defaultValue={client?.website_url || ''}
                placeholder="https://exemple.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              name="address"
              defaultValue={client?.address || ''}
              placeholder="123 Rue Principale, Ville, Pays"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="google_maps_url">URL Google Maps</Label>
            <Input
              id="google_maps_url"
              name="google_maps_url"
              type="url"
              defaultValue={client?.google_maps_url || ''}
              placeholder="https://maps.google.com/..."
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-xs uppercase text-muted-foreground">Google Business Profile</CardTitle>
          <CardDescription>Détails de connexion GBP</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gbp_location_id">ID d'emplacement GBP</Label>
            <Input
              id="gbp_location_id"
              name="gbp_location_id"
              defaultValue={client?.gbp_location_id || ''}
              placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
            />
            <p className="text-xs text-muted-foreground">
              Google Place ID pour cet emplacement commercial
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-xs uppercase text-muted-foreground">Gestion de l'abonnement</CardTitle>
          <CardDescription>Détails de l'abonnement client</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subscription_status">Statut</Label>
              <Select
                value={subscriptionStatus}
                onValueChange={setSubscriptionStatus}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="paused">En pause</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
              <input
                type="hidden"
                name="subscription_status"
                value={subscriptionStatus}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription_start_date">Date de début</Label>
              <Input
                id="subscription_start_date"
                name="subscription_start_date"
                type="date"
                defaultValue={
                  client?.subscription_start_date
                    ? new Date(client.subscription_start_date).toISOString().split('T')[0]
                    : ''
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly_report_day">Jour du rapport mensuel</Label>
            <Input
              id="monthly_report_day"
              name="monthly_report_day"
              type="number"
              min="1"
              max="28"
              defaultValue={client?.monthly_report_day || 1}
            />
            <p className="text-xs text-muted-foreground">
              Jour du mois (1-28) où le rapport mensuel doit être généré
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-xs uppercase text-muted-foreground">Informations supplémentaires</CardTitle>
          <CardDescription>Notes et métadonnées</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={client?.notes || ''}
              placeholder="Notes internes sur ce client..."
              rows={4}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Note : Le Persona Acheteur, le Ton de Voix et les Concurrents peuvent être ajoutés plus tard via la page d'édition
            ou via le formulaire d'onboarding.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="transition-all duration-200 hover:scale-105 active:scale-95"
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="transition-all duration-200 hover:scale-105 active:scale-95"
        >
          {isSubmitting ? 'Enregistrement...' : client ? 'Mettre à jour le client' : 'Créer le client'}
        </Button>
      </div>
    </form>
  )
}
