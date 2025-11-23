'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { onboardingSchema, type OnboardingFormData } from '@/lib/validations/onboarding'
import { submitOnboarding } from '@/app/actions/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ColorPicker } from './color-picker'
import { VibeSliders } from './vibe-sliders'
import { ScheduleBuilder } from './schedule-builder'
import { TagInput } from './tag-input'
import { FileUpload } from './file-upload'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface OnboardingWizardProps {
  token: string
  client: any
  prefilledData?: any
}

const STEPS = [
  { id: 1, title: 'Identité & Ancrage Local', progress: 20 },
  { id: 2, title: 'La Machine à Remonter le Temps', progress: 40 },
  { id: 3, title: 'Visuel & Autorité', progress: 60 },
  { id: 4, title: 'Le Moteur Stratégique', progress: 80 },
  { id: 5, title: 'Protocole de Réputation', progress: 100 },
]

export function OnboardingWizard({ token, client, prefilledData }: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [shake, setShake] = useState(false)

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      company_name: client?.company_name || prefilledData?.company_name || '',
      website_url: client?.website_url || prefilledData?.website_url || '',
      social_links: client?.social_links || prefilledData?.social_links || {},
      location_type: (client?.location_type || prefilledData?.location_type || 'storefront') as 'storefront' | 'service_area',
      address: client?.address || prefilledData?.address || '',
      service_area: client?.service_area || prefilledData?.service_area || '',
      operational_contact: client?.operational_contact || prefilledData?.operational_contact || {
        name: '',
        phone: '',
        email: '',
      },
      operating_hours: client?.operating_hours || prefilledData?.operating_hours || {},
      seasonality: client?.seasonality || prefilledData?.seasonality || '',
      logo_url: client?.logo_url || prefilledData?.logo_url || '',
      brand_colors: client?.brand_colors || prefilledData?.brand_colors || {
        primary: '#000000',
        secondary: '#000000',
      },
      authority_signals: client?.authority_signals || prefilledData?.authority_signals || {
        certifications: [],
        warranties: '',
      },
      media_gallery: client?.media_gallery || prefilledData?.media_gallery || [],
      strategy_profile: client?.strategy_profile || prefilledData?.strategy_profile || {
        vibe_sliders: {
          tone: 50,
          expertise: 50,
          style: 50,
        },
        pitch: '',
        differentiators: [],
        persona: '',
        keywords: [],
      },
      review_signature: client?.review_signature || prefilledData?.review_signature || '',
      competitors: client?.competitors || prefilledData?.competitors || [],
      review_incentives: client?.review_incentives || prefilledData?.review_incentives || '',
    },
  })

  // Mark component as mounted (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-save to localStorage (only after mount to avoid hydration issues)
  useEffect(() => {
    if (!mounted) return
    
    const subscription = form.watch((value) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`onboarding-${token}`, JSON.stringify(value))
      }
    })
    return () => subscription.unsubscribe()
  }, [form, token, mounted])

  // Load from localStorage on mount (only after mount to avoid hydration issues)
  useEffect(() => {
    if (!mounted) return
    
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`onboarding-${token}`)
      if (saved) {
        try {
          const data = JSON.parse(saved)
          Object.keys(data).forEach((key) => {
            if (data[key] !== undefined) {
              form.setValue(key as any, data[key])
            }
          })
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, [token, form, mounted])

  const nextStep = async () => {
    const isValid = await form.trigger()
    if (!isValid) {
      // Show shake animation and error notification
      setShake(true)
      setTimeout(() => setShake(false), 500)
      
      // Show error message
      const errorCount = Object.keys(form.formState.errors).length
      setSubmitError(`Veuillez corriger ${errorCount} erreur${errorCount > 1 ? 's' : ''} avant de continuer.`)
      
      // Scroll to first error
      const firstError = Object.keys(form.formState.errors)[0]
      if (firstError) {
        const element = document.querySelector(`[name="${firstError}"]`) || 
                       document.querySelector(`#${firstError}`) ||
                       document.querySelector(`[id*="${firstError}"]`)
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
    
    if (currentStep < 5) {
      setSubmitError(null)
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const onSubmit = async (data: OnboardingFormData) => {
    setSubmitting(true)
    setSubmitError(null)

    const result = await submitOnboarding(token, data)

    if (result.success) {
      localStorage.removeItem(`onboarding-${token}`)
      // Redirect to success page or show success message
      // Extract slug from current URL or use default
      const currentPath = window.location.pathname
      const pathParts = currentPath.split('/')
      const slug = pathParts[pathParts.length - 2] || 'client'
      router.push(`/onboarding/${slug}/${token}/success`)
    } else {
      setSubmitError(result.error || 'Échec de l\'envoi du formulaire')
      setSubmitting(false)
    }
  }

  const currentStepData = STEPS.find((s) => s.id === currentStep)!

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold tracking-tight">Assistant d'Onboarding</h1>
            <span className="text-sm text-muted-foreground">
              Étape {currentStep} sur {STEPS.length}
            </span>
          </div>
          <Progress value={currentStepData.progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">{currentStepData.title}</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-6 ${shake ? 'animate-shake' : ''}`}>
        {/* Step 1: Vital Intelligence */}
        {currentStep === 1 && (
          <Card className="bg-white/80 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl">
            <CardHeader className="p-8">
              <CardTitle className="text-xl tracking-tight">Étape 1 : Identité & Ancrage Local</CardTitle>
              <CardDescription className="mt-2">Veuillez valider les informations ci-dessous. Ces données définiront l'identité officielle de votre entreprise. Corrigez toute erreur par rapport à la réalité.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8 pt-0">
              <div className="space-y-2">
                <Label htmlFor="company_name">Nom de l'entreprise *</Label>
                <Input
                  id="company_name"
                  {...form.register('company_name')}
                  placeholder="Nom de votre entreprise"
                  className={`bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 ${
                    form.formState.errors.company_name ? 'border-destructive focus:ring-destructive/20' : ''
                  }`}
                />
                {form.formState.errors.company_name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.company_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website_url">URL du site web</Label>
                <Input
                  id="website_url"
                  type="url"
                  {...form.register('website_url')}
                  placeholder="https://exemple.com"
                  className={`bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 ${
                    form.formState.errors.website_url ? 'border-destructive focus:ring-destructive/20' : ''
                  }`}
                />
                {form.formState.errors.website_url && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.website_url.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Liens des réseaux sociaux</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Input
                      placeholder="URL Instagram"
                      {...form.register('social_links.instagram')}
                      className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <Input
                      placeholder="URL LinkedIn"
                      {...form.register('social_links.linkedin')}
                      className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <Input
                      placeholder="URL Facebook"
                      {...form.register('social_links.facebook')}
                      className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <Input
                      placeholder="URL Twitter/X"
                      {...form.register('social_links.twitter')}
                      className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mode d'interaction client</Label>
                <Select
                  value={form.watch('location_type')}
                  onValueChange={(value) => form.setValue('location_type', value as 'storefront' | 'service_area')}
                >
                  <SelectTrigger className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="storefront">Établissement physique</SelectItem>
                    <SelectItem value="service_area">Zone d'intervention</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.watch('location_type') === 'storefront' ? (
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse physique</Label>
                  <Input
                    id="address"
                    {...form.register('address')}
                    placeholder="123 Rue Principale, Ville, Pays"
                    className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="service_area">Zone d'intervention</Label>
                  <Textarea
                    id="service_area"
                    {...form.register('service_area')}
                    placeholder="Listez les villes, codes postaux ou décrivez votre rayon d'intervention"
                    rows={3}
                    className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                  />
                </div>
              )}

              <div className="space-y-4 border-t pt-6">
                <h3 className="font-semibold tracking-tight">Contact opérationnel</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">Nom *</Label>
                    <Input
                      id="contact_name"
                      {...form.register('operational_contact.name')}
                      placeholder="Jean Dupont"
                      className={`bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 ${
                        form.formState.errors.operational_contact?.name ? 'border-destructive focus:ring-destructive/20' : ''
                      }`}
                    />
                    {form.formState.errors.operational_contact?.name && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.operational_contact.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Téléphone *</Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      {...form.register('operational_contact.phone')}
                      placeholder="+33 1 23 45 67 89"
                      className={`bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 ${
                        form.formState.errors.operational_contact?.phone ? 'border-destructive focus:ring-destructive/20' : ''
                      }`}
                    />
                    {form.formState.errors.operational_contact?.phone && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.operational_contact.phone.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Email *</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      {...form.register('operational_contact.email')}
                      placeholder="contact@exemple.com"
                      className={`bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 ${
                        form.formState.errors.operational_contact?.email ? 'border-destructive focus:ring-destructive/20' : ''
                      }`}
                    />
                    {form.formState.errors.operational_contact?.email && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.operational_contact.email.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: The Time Machine */}
        {currentStep === 2 && (
          <Card className="bg-white/80 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl">
            <CardHeader className="p-8">
              <CardTitle className="text-xl tracking-tight">Étape 2 : La Machine à Remonter le Temps</CardTitle>
              <CardDescription className="mt-2">Horaires d'ouverture et saisonnalité</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8 pt-0">
              <ScheduleBuilder
                schedule={form.watch('operating_hours') || {}}
                onChange={(schedule) => form.setValue('operating_hours', schedule)}
              />

              <div className="space-y-2">
                <Label htmlFor="seasonality">Saisons de pointe</Label>
                <Textarea
                  id="seasonality"
                  {...form.register('seasonality')}
                  placeholder="Décrivez vos saisons de pointe (ex. : 'Été pour les services de climatisation', 'Décembre pour les ventes de fin d'année')"
                  rows={3}
                  className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Visual & Authority */}
        {currentStep === 3 && (
          <Card className="bg-white/80 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl">
            <CardHeader className="p-8">
              <CardTitle className="text-xl tracking-tight">Étape 3 : Visuel & Autorité</CardTitle>
              <CardDescription className="mt-2">Identité visuelle, certifications et médias</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8 pt-0">
              <FileUpload
                label="Logo de l'entreprise"
                value={form.watch('logo_url')}
                onChange={(url) => form.setValue('logo_url', url || undefined)}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <ColorPicker
                  label="Couleur principale"
                  value={form.watch('brand_colors?.primary') || '#000000'}
                  onChange={(color) =>
                    form.setValue('brand_colors', {
                      ...form.watch('brand_colors'),
                      primary: color,
                      secondary: form.watch('brand_colors?.secondary') || '#000000',
                    })
                  }
                />
                <ColorPicker
                  label="Couleur secondaire"
                  value={form.watch('brand_colors?.secondary') || '#000000'}
                  onChange={(color) =>
                    form.setValue('brand_colors', {
                      ...form.watch('brand_colors'),
                      primary: form.watch('brand_colors?.primary') || '#000000',
                      secondary: color,
                    })
                  }
                />
              </div>

              <TagInput
                label="Certifications & Labels"
                placeholder="ex. : RGE, Étoile Michelin, Barreau de Paris"
                tags={form.watch('authority_signals?.certifications') || []}
                onChange={(tags) =>
                  form.setValue('authority_signals', {
                    ...form.watch('authority_signals'),
                    certifications: tags,
                    warranties: form.watch('authority_signals?.warranties') || '',
                  })
                }
              />

              <div className="space-y-2">
                <Label htmlFor="warranties">Garanties / Assurances</Label>
                <Input
                  id="warranties"
                  value={form.watch('authority_signals?.warranties') || ''}
                  onChange={(e) =>
                    form.setValue('authority_signals', {
                      ...form.watch('authority_signals'),
                      certifications: form.watch('authority_signals?.certifications') || [],
                      warranties: e.target.value || undefined,
                    })
                  }
                  placeholder="ex. : Décennale, Satisfait ou Remboursé"
                  className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <Label>Galerie Médias (Bientôt disponible)</Label>
                <p className="text-sm text-muted-foreground">
                  Les photos d'équipe, de travaux et d'équipements pourront être ajoutées ultérieurement.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: The Strategy Engine */}
        {currentStep === 4 && (
          <Card className="bg-white/80 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl">
            <CardHeader className="p-8">
              <CardTitle className="text-xl tracking-tight">Étape 4 : Le Moteur Stratégique</CardTitle>
              <CardDescription className="mt-2">Définissez la voix de votre marque et votre stratégie de communication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8 pt-0">
              <VibeSliders
                tone={form.watch('strategy_profile?.vibe_sliders.tone') || 50}
                expertise={form.watch('strategy_profile?.vibe_sliders.expertise') || 50}
                style={form.watch('strategy_profile?.vibe_sliders.style') || 50}
                onToneChange={(value) =>
                  form.setValue('strategy_profile.vibe_sliders.tone', value)
                }
                onExpertiseChange={(value) =>
                  form.setValue('strategy_profile.vibe_sliders.expertise', value)
                }
                onStyleChange={(value) =>
                  form.setValue('strategy_profile.vibe_sliders.style', value)
                }
              />

              <div className="space-y-2">
                <Label htmlFor="pitch">Pitch en une phrase</Label>
                <Textarea
                  id="pitch"
                  value={form.watch('strategy_profile?.pitch') || ''}
                  onChange={(e) =>
                    form.setValue('strategy_profile.pitch', e.target.value || undefined)
                  }
                  placeholder="Comment décririez-vous votre entreprise à un enfant de 5 ans ?"
                  rows={2}
                  className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <Label>Différenciateurs (3 arguments de vente uniques)</Label>
                {[0, 1, 2].map((index) => {
                  const differentiators = form.watch('strategy_profile?.differentiators') || []
                  return (
                    <Input
                      key={index}
                      placeholder={`Différenciateur ${index + 1}`}
                      value={differentiators[index] || ''}
                      onChange={(e) => {
                        const newDifferentiators = [...differentiators]
                        newDifferentiators[index] = e.target.value
                        form.setValue('strategy_profile.differentiators', newDifferentiators)
                      }}
                      className="mb-2 bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                    />
                  )
                })}
              </div>

              <div className="space-y-2">
                <Label htmlFor="persona">Description du client idéal</Label>
                <Textarea
                  id="persona"
                  value={form.watch('strategy_profile?.persona') || ''}
                  onChange={(e) =>
                    form.setValue('strategy_profile.persona', e.target.value || undefined)
                  }
                  placeholder="Décrivez votre client idéal (âge, besoins, points de douleur, objectifs)"
                  rows={4}
                  className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                />
              </div>

              <TagInput
                label="Mots-clés cibles"
                placeholder="Ajoutez des mots-clés SEO"
                tags={form.watch('strategy_profile?.keywords') || []}
                onChange={(tags) =>
                  form.setValue('strategy_profile.keywords', tags)
                }
              />
            </CardContent>
          </Card>
        )}

        {/* Step 5: Reputation Protocol */}
        {currentStep === 5 && (
          <Card className="bg-white/80 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl">
            <CardHeader className="p-8">
              <CardTitle className="text-xl tracking-tight">Étape 5 : Protocole de Réputation</CardTitle>
              <CardDescription className="mt-2">Gestion des avis et analyse concurrentielle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8 pt-0">
              <div className="space-y-2">
                <Label htmlFor="review_signature">Signature des avis</Label>
                <Input
                  id="review_signature"
                  {...form.register('review_signature')}
                  placeholder="ex. : L'équipe FEV, Dr. House"
                  className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                />
                <p className="text-xs text-muted-foreground">
                  Comment l'IA doit-elle signer les réponses aux avis ?
                </p>
              </div>

              <div className="space-y-2">
                <Label>Concurrents (jusqu'à 3)</Label>
                {[0, 1, 2].map((index) => {
                  const competitors = form.watch('competitors') || []
                  const competitor = competitors[index] || { name: '', url: '' }
                  return (
                    <div key={index} className="grid gap-2 md:grid-cols-2">
                      <Input
                        placeholder={`Nom du concurrent ${index + 1}`}
                        value={competitor.name || ''}
                        onChange={(e) => {
                          const newCompetitors = [...competitors]
                          newCompetitors[index] = { ...competitor, name: e.target.value }
                          form.setValue('competitors', newCompetitors)
                        }}
                        className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                      />
                      <Input
                        placeholder="URL GBP (optionnel)"
                        type="url"
                        value={competitor.url || ''}
                        onChange={(e) => {
                          const newCompetitors = [...competitors]
                          newCompetitors[index] = { ...competitor, url: e.target.value }
                          form.setValue('competitors', newCompetitors)
                        }}
                        className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                      />
                    </div>
                  )
                })}
              </div>

              <div className="space-y-2">
                <Label htmlFor="review_incentives">Incitations aux avis (Optionnel)</Label>
                <Textarea
                  id="review_incentives"
                  {...form.register('review_incentives')}
                  placeholder="Offrez-vous des incitations pour les avis ? Décrivez votre politique."
                  rows={3}
                  className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="transition-all duration-300 rounded-xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Précédent
          </Button>

          {currentStep < 5 ? (
            <Button 
              type="button" 
              onClick={nextStep}
              className="bg-primary shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-xl"
            >
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={submitting}
              className="bg-primary shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-xl"
            >
              {submitting ? (
                'Envoi en cours...'
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Finaliser l'onboarding
                </>
              )}
            </Button>
          )}
        </div>

        {submitError && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive mt-4 animate-in fade-in slide-in-from-top-2">
            {submitError}
          </div>
        )}
      </form>
      </div>
    </div>
  )
}

