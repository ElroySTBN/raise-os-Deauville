import { z } from 'zod'

export const onboardingSchema = z.object({
  // Step 1: Vital Intelligence
  company_name: z.string().min(1, 'Company name is required'),
  website_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  social_links: z.object({
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    youtube: z.string().optional(),
  }).optional(),
  location_type: z.enum(['storefront', 'service_area']),
  address: z.string().optional(),
  service_area: z.string().optional(),
  operational_contact: z.object({
    name: z.string().min(1, 'Contact name is required'),
    phone: z.string().min(1, 'Phone is required'),
    email: z.string().email('Invalid email').min(1, 'Email is required'),
  }),

  // Step 2: The Time Machine
  operating_hours: z.record(z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean(),
    split_hours: z.object({
      morning_open: z.string(),
      morning_close: z.string(),
      afternoon_open: z.string(),
      afternoon_close: z.string(),
    }).optional(),
  })).optional(),
  seasonality: z.string().optional(),

  // Step 3: Visual & Authority
  logo_url: z.string().optional(),
  brand_colors: z.object({
    primary: z.string(),
    secondary: z.string(),
  }).optional(),
  authority_signals: z.object({
    certifications: z.array(z.string()),
    warranties: z.string().optional(),
  }).optional(),
  media_gallery: z.array(z.object({
    url: z.string(),
    type: z.enum(['team', 'work', 'equipment']),
  })).optional(),

  // Step 4: The Strategy Engine
  strategy_profile: z.object({
    vibe_sliders: z.object({
      tone: z.number().min(0).max(100),
      expertise: z.number().min(0).max(100),
      style: z.number().min(0).max(100),
    }),
    pitch: z.string().optional(),
    differentiators: z.array(z.string()).max(3),
    persona: z.string().optional(),
    keywords: z.array(z.string()),
  }).optional(),

  // Step 5: Reputation Protocol
  review_signature: z.string().optional(),
  competitors: z.array(z.object({
    name: z.string(),
    url: z.string().optional(),
  })).optional(),
  review_incentives: z.string().optional(),
})

export type OnboardingFormData = z.infer<typeof onboardingSchema>

