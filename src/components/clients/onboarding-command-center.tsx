'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { generateMagicLink } from '@/app/actions/magic-links'
import { Edit, Copy, Check, ExternalLink } from 'lucide-react'

interface OnboardingCommandCenterProps {
  clientId: string
  onboardingStatus?: string | null
  companyName?: string
}

export function OnboardingCommandCenter({ 
  clientId, 
  onboardingStatus = 'pending',
  companyName = ''
}: OnboardingCommandCenterProps) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'En attente',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        }
      case 'draft':
        return {
          label: 'Brouillon',
          variant: 'default' as const,
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        }
      case 'completed':
        return {
          label: 'Terminé',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        }
      default:
        return {
          label: 'En attente',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        }
    }
  }

  const handlePreFill = async () => {
    setLoading(true)
    try {
      const result = await generateMagicLink(clientId)
      if (result.success && result.url) {
        // Open in new tab
        window.open(result.url, '_blank')
      }
    } catch (error) {
      console.error('Error generating magic link:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    setLoading(true)
    try {
      const result = await generateMagicLink(clientId)
      if (result.success && result.url) {
        await navigator.clipboard.writeText(result.url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (error) {
      console.error('Error copying magic link:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusConfig = getStatusConfig(onboardingStatus || 'pending')

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Suivi Onboarding</CardTitle>
            <CardDescription>Gérez le processus d'onboarding du client</CardDescription>
          </div>
          <Badge 
            variant={statusConfig.variant}
            className={statusConfig.className}
          >
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handlePreFill}
            disabled={loading}
            className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Edit className="mr-2 h-4 w-4" />
            Pré-remplir le dossier
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleCopyLink}
            disabled={loading}
            className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Lien copié !
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copier le lien client
              </>
            )}
          </Button>
        </div>
        {onboardingStatus === 'draft' && (
          <p className="text-xs text-muted-foreground mt-3">
            Le dossier a été pré-rempli. Le client peut maintenant valider les informations.
          </p>
        )}
        {onboardingStatus === 'completed' && (
          <p className="text-xs text-muted-foreground mt-3">
            L'onboarding a été complété par le client.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

