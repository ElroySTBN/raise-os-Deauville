'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

// Server Action to generate a magic link for client onboarding
// Singleton pattern: Returns existing valid link if available, otherwise creates new one
export async function generateMagicLink(clientId: string) {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      })
      return {
        success: false,
        error: 'Server configuration error: Missing Supabase credentials. Please check your .env.local file.',
      }
    }

    // Use service role for admin operations
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

    // Fetch client name to create a friendly URL
    const { data: client } = await supabase
      .from('clients')
      .select('company_name')
      .eq('id', clientId)
      .single()

    if (!client) {
      return {
        success: false,
        error: 'Client not found',
      }
    }

    // Singleton pattern: Check for existing valid magic link
    const now = new Date().toISOString()
    const { data: existingLink } = await supabase
      .from('magic_links')
      .select('token, expires_at')
      .eq('client_id', clientId)
      .eq('used', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // If valid link exists, return it
    if (existingLink) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const clientSlug = client.company_name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50)
      const onboardingUrl = `${baseUrl}/onboarding/${clientSlug}/${existingLink.token}`

      return {
        success: true,
        token: existingLink.token,
        url: onboardingUrl,
        expiresAt: existingLink.expires_at,
        existing: true,
      }
    }

    // No valid link exists, create a new one
    const token = crypto.randomUUID()
    
    // Set expiry to 7 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Insert magic link into database
    const { data, error } = await supabase
      .from('magic_links')
      .insert({
        token,
        client_id: clientId,
        expires_at: expiresAt.toISOString(),
        used: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error generating magic link:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Generate the public URL with client name slug for better UX
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const clientSlug = client.company_name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50) // Limit length
    const onboardingUrl = `${baseUrl}/onboarding/${clientSlug}/${token}`

    revalidatePath(`/dashboard/clients/${clientId}`)

    return {
      success: true,
      token,
      url: onboardingUrl,
      expiresAt: expiresAt.toISOString(),
      existing: false,
    }
  } catch (error: any) {
    console.error('Error in generateMagicLink:', error)
    return {
      success: false,
      error: error.message || 'Failed to generate magic link',
    }
  }
}

// Server Action to validate a magic link token
export async function validateMagicLink(token: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return {
        valid: false,
        error: 'Server configuration error',
      }
    }

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

    // Fetch magic link with FULL client data (including all JSONB columns for pre-fill)
    const { data, error } = await supabase
      .from('magic_links')
      .select(`
        *,
        clients (
          id,
          company_name,
          industry,
          website_url,
          phone,
          address,
          google_maps_url,
          social_links,
          operational_contact,
          location_type,
          service_area,
          operating_hours,
          seasonality,
          logo_url,
          brand_colors,
          authority_signals,
          media_gallery,
          strategy_profile,
          review_signature,
          competitors,
          review_incentives,
          buyer_persona,
          tone_of_voice,
          notes
        )
      `)
      .eq('token', token)
      .single()

    if (error || !data) {
      return {
        valid: false,
        error: 'Invalid or expired link',
      }
    }

    // Check if link is expired
    const now = new Date()
    const expiresAt = new Date(data.expires_at)
    
    if (now > expiresAt) {
      return {
        valid: false,
        error: 'This link has expired',
      }
    }

    // Check if link has already been used
    if (data.used) {
      return {
        valid: false,
        error: 'This link has already been used',
      }
    }

    return {
      valid: true,
      magicLink: data,
      client: data.clients,
      prefilledData: data.prefilled_data,
    }
  } catch (error: any) {
    console.error('Error validating magic link:', error)
    return {
      valid: false,
      error: error.message || 'Failed to validate link',
    }
  }
}

