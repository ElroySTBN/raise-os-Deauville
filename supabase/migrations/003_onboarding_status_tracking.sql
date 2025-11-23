-- ============================================================================
-- Migration 003: Add onboarding_status tracking to clients table
-- ============================================================================
-- This migration adds status tracking for the unified onboarding workflow
-- ============================================================================

-- Add onboarding_status column to clients table
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT 
    DEFAULT 'pending' 
    CHECK (onboarding_status IN ('pending', 'draft', 'completed'));

-- Add index for performance when querying by status
CREATE INDEX IF NOT EXISTS idx_clients_onboarding_status 
  ON public.clients(onboarding_status);

-- Update existing clients to have 'pending' status if NULL
UPDATE public.clients
  SET onboarding_status = 'pending'
  WHERE onboarding_status IS NULL;

-- ============================================================================
-- Status Values:
-- 'pending'  - New client, no onboarding started
-- 'draft'    - Admin has pre-filled data, waiting for client validation
-- 'completed' - Client has completed and submitted the onboarding form
-- ============================================================================

