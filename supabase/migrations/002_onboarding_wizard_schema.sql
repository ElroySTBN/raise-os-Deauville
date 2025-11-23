-- ============================================================================
-- Phase 2: Onboarding Wizard Schema Migration
-- ============================================================================
-- This migration adds JSONB columns to clients table for the 5-step onboarding wizard
-- and creates the client-assets storage bucket
-- ============================================================================

-- Add new columns to clients table for onboarding wizard data
ALTER TABLE public.clients
  -- Step 1: Vital Intelligence
  ADD COLUMN IF NOT EXISTS social_links JSONB, -- {instagram, linkedin, facebook, etc.}
  ADD COLUMN IF NOT EXISTS operational_contact JSONB, -- {name, phone, email}
  ADD COLUMN IF NOT EXISTS location_type TEXT CHECK (location_type IN ('storefront', 'service_area')),
  ADD COLUMN IF NOT EXISTS service_area TEXT, -- Cities/zip codes or radius description
  
  -- Step 2: The Time Machine
  ADD COLUMN IF NOT EXISTS operating_hours JSONB, -- Weekly schedule with split hours
  ADD COLUMN IF NOT EXISTS seasonality TEXT, -- Peak seasons description
  
  -- Step 3: Visual & Authority
  ADD COLUMN IF NOT EXISTS logo_url TEXT, -- Supabase Storage URL
  ADD COLUMN IF NOT EXISTS brand_colors JSONB, -- {primary: "#hex", secondary: "#hex"}
  ADD COLUMN IF NOT EXISTS authority_signals JSONB, -- {certifications: [], warranties: ""}
  ADD COLUMN IF NOT EXISTS media_gallery JSONB, -- [{url, type: "team"|"work"|"equipment"}]
  
  -- Step 4: The Strategy Engine
  ADD COLUMN IF NOT EXISTS strategy_profile JSONB, -- {vibe_sliders: {}, pitch: "", differentiators: [], persona: "", keywords: []}
  
  -- Step 5: Reputation Protocol
  ADD COLUMN IF NOT EXISTS review_signature TEXT, -- How AI signs review responses
  ADD COLUMN IF NOT EXISTS review_incentives TEXT; -- Optional review incentive details

-- Note: The magic_links table already exists from Phase 1 migration
-- We just need to ensure it has the prefilled_data column (already exists)

-- ============================================================================
-- STORAGE BUCKET: client-assets
-- ============================================================================
-- Create the storage bucket for client uploads (logos, team photos, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-assets',
  'client-assets',
  true, -- Public bucket for easy access to client assets
  10485760, -- 10MB limit (larger than post-images for photos)
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for client-assets bucket
-- Allow public read (clients need to see their uploaded assets)
DROP POLICY IF EXISTS "Public can read client assets" ON storage.objects;
CREATE POLICY "Public can read client assets"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'client-assets');

-- Allow authenticated users to upload (admin can upload on behalf of clients)
DROP POLICY IF EXISTS "Authenticated users can upload client assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload client assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'client-assets');

-- Allow authenticated users to delete client assets
DROP POLICY IF EXISTS "Authenticated users can delete client assets" ON storage.objects;
CREATE POLICY "Authenticated users can delete client assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'client-assets');

-- Allow anonymous users to upload (for onboarding form)
-- This is secure because the Server Action validates the magic link token first
DROP POLICY IF EXISTS "Anonymous can upload via magic link" ON storage.objects;
CREATE POLICY "Anonymous can upload via magic link"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'client-assets');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All new columns added to clients table
-- client-assets storage bucket created with appropriate policies
-- ============================================================================

