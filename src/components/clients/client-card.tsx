'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface ClientCardProps {
  client: {
    id: string
    company_name: string
    industry?: string
    phone?: string
    website_url?: string
    subscription_status: string
    gbp_connected?: boolean
    created_at: string
  }
}

function getStatusColor(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
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

export function ClientCard({ client }: ClientCardProps) {
  const router = useRouter()

  const handleCardClick = () => {
    router.push(`/dashboard/clients/${client.id}`)
  }

  const statusLabels: Record<string, string> = {
    active: 'Actif',
    paused: 'En pause',
    cancelled: 'Annulé',
  }

  return (
    <Card 
      className="hover:bg-muted/50 transition-colors cursor-pointer shadow-sm hover:shadow-md transition-shadow border-b"
      onClick={handleCardClick}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold">{client.company_name}</h3>
            <Badge variant={getStatusColor(client.subscription_status)}>
              {statusLabels[client.subscription_status] || client.subscription_status}
            </Badge>
            {client.gbp_connected && (
              <Badge variant="outline">GBP Connecté</Badge>
            )}
          </div>
          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
            {client.industry && <span>{client.industry}</span>}
            {client.phone && <span>{client.phone}</span>}
            {client.website_url && (
              <a
                href={client.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                Site web
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Créé le {formatDate(client.created_at)}
        </div>
      </CardContent>
    </Card>
  )
}

