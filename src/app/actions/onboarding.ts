'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Type definitions for onboarding form data
export interface OnboardingFormData {
  // Step 1: Vital Intelligence
  company_name: string
  website_url?: string
  social_links?: {
    instagram?: string
    linkedin?: string
    facebook?: string
    twitter?: string
    youtube?: string
  }
  location_type: 'storefront' | 'service_area'
  address?: string
  service_area?: string
  operational_contact: {
    name: string
    phone: string
    email: string
  }
  
  // Step 2: The Time Machine
  operating_hours?: {
    [key: string]: {
      open: string
      close: string
      closed: boolean
      split_hours?: {
        morning_open: string
        morning_close: string
        afternoon_open: string
        afternoon_close: string
      }
    }
  }
  seasonality?: string
  
  // Step 3: Visual & Authority
  logo_url?: string
  brand_colors?: {
    primary: string
    secondary: string
  }
  authority_signals?: {
    certifications: string[]
    warranties: string
  }
  media_gallery?: Array<{
    url: string
    type: 'team' | 'work' | 'equipment'
  }>
  
  // Step 4: The Strategy Engine
  strategy_profile?: {
    vibe_sliders: {
      tone: number // 0-100 (Formal ↔️ Friendly)
      expertise: number // 0-100 (Popularized ↔️ Highly Technical)
      style: number // 0-100 (Minimalist ↔️ Emoji-Rich)
    }
    pitch: string // One sentence pitch
    differentiators: string[] // 3 unique selling points
    persona: string // Ideal client description
    keywords: string[] // Target keywords for SEO
  }
  
  // Step 5: Reputation Protocol
  review_signature?: string
  competitors?: Array<{
    name: string
    url?: string
  }>
  review_incentives?: string
}

// Server Action to submit onboarding form
export async function submitOnboarding(token: string, formData: OnboardingFormData) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return {
        success: false,
        error: 'Server configuration error: Missing Supabase credentials',
      }
    }

    // First, validate the magic link
    const supabase = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Validate token
    const { data: magicLink, error: linkError } = await supabase
      .from('magic_links')
      .select('*, clients(*)')
      .eq('token', token)
      .single()

    if (linkError || !magicLink) {
      return {
        success: false,
        error: 'Invalid or expired link',
      }
    }

    // Check if link is expired
    const now = new Date()
    const expiresAt = new Date(magicLink.expires_at)
    
    if (now > expiresAt) {
      return {
        success: false,
        error: 'This link has expired',
      }
    }

    // Check if link has already been used
    if (magicLink.used) {
      return {
        success: false,
        error: 'This link has already been used',
      }
    }

    const clientId = magicLink.client_id

    // Prepare update data
    const updateData: any = {
      company_name: formData.company_name,
      website_url: formData.website_url || null,
      social_links: formData.social_links || null,
      location_type: formData.location_type,
      address: formData.location_type === 'storefront' ? formData.address || null : null,
      service_area: formData.location_type === 'service_area' ? formData.service_area || null : null,
      operational_contact: formData.operational_contact || null,
      operating_hours: formData.operating_hours || null,
      seasonality: formData.seasonality || null,
      logo_url: formData.logo_url || null,
      brand_colors: formData.brand_colors || null,
      authority_signals: formData.authority_signals || null,
      media_gallery: formData.media_gallery || null,
      strategy_profile: formData.strategy_profile || null,
      review_signature: formData.review_signature || null,
      review_incentives: formData.review_incentives || null,
      updated_at: new Date().toISOString(),
    }

    // Handle competitors - merge with existing or create new
    if (formData.competitors && formData.competitors.length > 0) {
      updateData.competitors = formData.competitors.map(comp => ({
        name: comp.name,
        gbp_url: comp.url || null,
      }))
    }

    // Update client record with onboarding_status = 'completed'
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        ...updateData,
        onboarding_status: 'completed',
      })
      .eq('id', clientId)

    if (updateError) {
      console.error('Error updating client:', updateError)
      return {
        success: false,
        error: updateError.message,
      }
    }

    // Mark magic link as used
    const { error: markUsedError } = await supabase
      .from('magic_links')
      .update({
        used: true,
        used_at: new Date().toISOString(),
      })
      .eq('token', token)

    if (markUsedError) {
      console.error('Error marking magic link as used:', markUsedError)
      // Don't fail the whole operation if this fails
    }

    revalidatePath(`/dashboard/clients/${clientId}`)

    return {
      success: true,
      message: 'Onboarding completed successfully!',
    }
  } catch (error: any) {
    console.error('Error in submitOnboarding:', error)
    return {
      success: false,
      error: error.message || 'Failed to submit onboarding form',
    }
  }
}

