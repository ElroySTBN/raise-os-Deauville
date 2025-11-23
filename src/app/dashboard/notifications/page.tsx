import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const typeLabels: Record<string, string> = {
    report_due: 'Rapport dû',
    content_approval_needed: 'Approbation de contenu requise',
    review_response_needed: 'Réponse aux avis requise',
    oauth_expired: 'OAuth expiré',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">
          Alertes et rappels proactifs (À venir dans la Phase 6)
        </p>
      </div>

      {!notifications || notifications.length === 0 ? (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Aucune notification pour le moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card key={notification.id} className="hover:bg-muted/50 transition-colors shadow-sm hover:shadow-md transition-shadow border-b">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{notification.title}</h3>
                    {!notification.read && (
                      <Badge variant="default">Nouveau</Badge>
                    )}
                    <Badge variant="outline">{typeLabels[notification.type] || notification.type}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(notification.created_at)}
                  </p>
                </div>
                {notification.action_url && (
                  <Link href={notification.action_url}>
                    <Button variant="outline" size="sm" className="transition-all duration-200 hover:scale-105 active:scale-95">
                      Voir
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
