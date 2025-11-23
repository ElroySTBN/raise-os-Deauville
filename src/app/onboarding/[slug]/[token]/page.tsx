import { validateMagicLink } from '@/app/actions/magic-links'
import { notFound } from 'next/navigation'
import { OnboardingWizard } from '@/components/onboarding/wizard'

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>
}) {
  const { token } = await params
  // Validate the magic link token (slug is just for UX, we validate by token)
  const validation = await validateMagicLink(token)

  if (!validation.valid) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <OnboardingWizard
        token={token}
        client={validation.client}
        prefilledData={validation.prefilledData}
      />
    </div>
  )
}

