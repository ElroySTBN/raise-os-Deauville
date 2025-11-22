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

        if (updateError) throw updateError
        router.push(`/dashboard/clients/${client.id}`)
      } else {
        // Create new client
        const { data: newClient, error: insertError } = await supabase
          .from('clients')
          .insert(data)
          .select()
          .single()

        if (insertError) throw insertError
        router.push(`/dashboard/clients/${newClient.id}`)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Company details and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name *</Label>
            <Input
              id="company_name"
              name="company_name"
              defaultValue={client?.company_name}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              name="industry"
              defaultValue={client?.industry || ''}
              placeholder="e.g., Healthcare, Restaurant, Legal Services"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={client?.phone || ''}
                placeholder="+33 1 23 45 67 89"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                name="website_url"
                type="url"
                defaultValue={client?.website_url || ''}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={client?.address || ''}
              placeholder="123 Main Street, City, Country"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="google_maps_url">Google Maps URL</Label>
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

      <Card>
        <CardHeader>
          <CardTitle>Google Business Profile</CardTitle>
          <CardDescription>GBP connection details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gbp_location_id">GBP Location ID</Label>
            <Input
              id="gbp_location_id"
              name="gbp_location_id"
              defaultValue={client?.gbp_location_id || ''}
              placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
            />
            <p className="text-xs text-muted-foreground">
              Google Place ID for this business location
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>Client subscription details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subscription_status">Status</Label>
              <Select
                value={subscriptionStatus}
                onValueChange={setSubscriptionStatus}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <input
                type="hidden"
                name="subscription_status"
                value={subscriptionStatus}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription_start_date">Start Date</Label>
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
            <Label htmlFor="monthly_report_day">Monthly Report Day</Label>
            <Input
              id="monthly_report_day"
              name="monthly_report_day"
              type="number"
              min="1"
              max="28"
              defaultValue={client?.monthly_report_day || 1}
            />
            <p className="text-xs text-muted-foreground">
              Day of the month (1-28) when the monthly report should be generated
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>Notes and metadata</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={client?.notes || ''}
              placeholder="Internal notes about this client..."
              rows={4}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Note: Buyer Persona, Tone of Voice, and Competitors can be added later via the edit page
            or through the onboarding form.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : client ? 'Update Client' : 'Create Client'}
        </Button>
      </div>
    </form>
  )
}
