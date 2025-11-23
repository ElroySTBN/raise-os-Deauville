import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, BarChart3, Bell } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch statistics
  const [clientsResult, postsResult, reportsResult, notificationsResult] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }),
    supabase.from('content_posts').select('id', { count: 'exact', head: true }),
    supabase.from('monthly_reports').select('id', { count: 'exact', head: true }),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('read', false),
  ])

  const stats = [
    {
      title: 'Total Clients',
      value: clientsResult.count || 0,
      icon: Users,
      href: '/dashboard/clients',
      description: 'Clients actifs',
    },
    {
      title: 'Publications',
      value: postsResult.count || 0,
      icon: FileText,
      href: '/dashboard/content',
      description: 'Publications générées',
    },
    {
      title: 'Rapports Mensuels',
      value: reportsResult.count || 0,
      icon: BarChart3,
      href: '/dashboard/reports',
      description: 'Rapports générés',
    },
    {
      title: 'Notifications Non Lues',
      value: notificationsResult.count || 0,
      icon: Bell,
      href: '/dashboard/notifications',
      description: 'Nécessitent une attention',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Bienvenue sur RaiseMed OS - Votre centre de commande pour l'optimisation GBP
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:bg-accent transition-colors cursor-pointer shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/clients/new">
              <Button className="w-full justify-start" variant="outline">
                Add New Client
              </Button>
            </Link>
            <Link href="/dashboard/content/new">
              <Button className="w-full justify-start" variant="outline">
                Generate Content
              </Button>
            </Link>
            <Link href="/dashboard/reports/generate">
              <Button className="w-full justify-start" variant="outline">
                Generate Report
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity feed coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
