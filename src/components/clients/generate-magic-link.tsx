'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { generateMagicLink } from '@/app/actions/magic-links'
import { Link2, Copy, Check } from 'lucide-react'

export function GenerateMagicLink({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [isExisting, setIsExisting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkExistingLink = useCallback(async () => {
    setChecking(true)
    setError(null)

    const result = await generateMagicLink(clientId)

    if (result.success && result.url) {
      setGeneratedUrl(result.url)
      setIsExisting(result.existing || false)
    } else {
      // No existing link found, that's okay - user can generate one
      setGeneratedUrl(null)
    }

    setChecking(false)
  }, [clientId])

  // Check for existing link when dialog opens
  useEffect(() => {
    if (open && !generatedUrl) {
      checkExistingLink()
    }
  }, [open, generatedUrl, checkExistingLink])

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    const result = await generateMagicLink(clientId)

    if (result.success && result.url) {
      setGeneratedUrl(result.url)
      setIsExisting(result.existing || false)
    } else {
      setError(result.error || 'Échec de la génération du lien')
    }

    setLoading(false)
  }

  const handleCopy = async () => {
    if (generatedUrl) {
      await navigator.clipboard.writeText(generatedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    // Reset state when dialog closes
    if (!isOpen) {
      setGeneratedUrl(null)
      setIsExisting(false)
      setError(null)
      setCopied(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="transition-all duration-200 hover:scale-105 active:scale-95">
          <Link2 className="mr-2 h-4 w-4" />
          Générer le lien
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lien d'onboarding</DialogTitle>
          <DialogDescription>
            Créez un lien sécurisé pour que votre client complète son formulaire d'onboarding.
            Le lien expire dans 7 jours.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {checking ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              Vérification du lien existant...
            </div>
          ) : !generatedUrl ? (
            <>
              <div className="text-sm text-muted-foreground">
                Cliquez sur le bouton ci-dessous pour générer un lien d'onboarding unique pour ce client.
              </div>
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {loading ? 'Génération...' : 'Générer le lien'}
              </Button>
            </>
          ) : (
            <>
              {isExisting && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    Lien Actif
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Un lien valide existe déjà pour ce client
                  </span>
                </div>
              )}
              <div className="space-y-2">
                <Label>Lien d'onboarding</Label>
                <div className="flex gap-2">
                  <Input
                    value={generatedUrl}
                    readOnly
                    className="font-mono text-xs flex-1"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopy}
                    title={copied ? 'Copié !' : 'Copier dans le presse-papiers'}
                    className="transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {copied && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Lien copié dans le presse-papiers !
                  </p>
                )}
              </div>
              <div className="rounded-md bg-muted p-3 text-sm">
                <p className="font-medium mb-1">Partagez ce lien avec votre client</p>
                <p className="text-muted-foreground text-xs">
                  Le lien expire dans 7 jours. Une fois utilisé, il ne peut plus être réutilisé.
                </p>
              </div>
              <div className="flex gap-2">
                {!isExisting && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setGeneratedUrl(null)
                      setIsExisting(false)
                      handleGenerate()
                    }}
                    className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Régénérer
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpen(false)
                  }}
                  className={isExisting ? "w-full transition-all duration-200 hover:scale-105 active:scale-95" : "flex-1 transition-all duration-200 hover:scale-105 active:scale-95"}
                >
                  Fermer
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

