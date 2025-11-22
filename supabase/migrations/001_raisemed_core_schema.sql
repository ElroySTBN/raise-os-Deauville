-- RaiseMed OS - Core Schema Migration
-- This migration creates all tables, indexes, RLS policies, and storage bucket for Phase 1

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE 0: profiles (User profiles - extends auth.users)
-- ============================================================================
-- This table must exist before notifications policies that reference it
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at TIMESTAMPTZ,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);

-- RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile."
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- TABLE 1: clients (The Source of Truth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Basic Info
  company_name TEXT NOT NULL,
  industry TEXT,
  website_url TEXT,
  phone TEXT,
  address TEXT,
  google_maps_url TEXT,
  
  -- GBP Connection
  gbp_location_id TEXT UNIQUE, -- Google Place ID
  gbp_connected BOOLEAN DEFAULT FALSE,
  
  -- Buyer Persona (from Audit)
  buyer_persona JSONB, -- {age_range, pain_points, goals, behaviors}
  
  -- Tone of Voice
  tone_of_voice JSONB, -- {style: "professional", keywords: ["expert", "trusted"]}
  
  -- Competitors
  competitors JSONB, -- [{name, gbp_url, strengths, weaknesses}]
  
  -- Subscription Management
  subscription_start_date DATE,
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'paused', 'cancelled')),
  monthly_report_day INTEGER DEFAULT 1 CHECK (monthly_report_day >= 1 AND monthly_report_day <= 28),
  
  -- Metadata
  notes TEXT,
  audit_data JSONB -- Raw audit data from existing system (backward compatibility)
);

-- Indexes for clients
CREATE INDEX IF NOT EXISTS idx_clients_gbp_location ON public.clients(gbp_location_id);
CREATE INDEX IF NOT EXISTS idx_clients_subscription_status ON public.clients(subscription_status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 2: master_prompts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.master_prompts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prompt Details
  name TEXT NOT NULL, -- "Weekly Update Template"
  category TEXT NOT NULL CHECK (category IN ('post_text', 'post_image', 'analysis', 'report')),
  prompt_template TEXT NOT NULL, -- "Write a GBP post for {{client.company_name}}..."
  
  -- Configuration
  variables JSONB, -- ["client.company_name", "client.tone_of_voice.style"]
  ai_provider TEXT DEFAULT 'openai', -- Which AI to use
  model TEXT DEFAULT 'gpt-4', -- Specific model
  
  -- Version Control
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  description TEXT,
  example_output TEXT
);

CREATE INDEX IF NOT EXISTS idx_master_prompts_category ON public.master_prompts(category);
CREATE INDEX IF NOT EXISTS idx_master_prompts_active ON public.master_prompts(is_active) WHERE is_active = TRUE;

CREATE TRIGGER update_master_prompts_updated_at
  BEFORE UPDATE ON public.master_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 3: content_posts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.content_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Relationships
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  master_prompt_id UUID REFERENCES public.master_prompts(id) ON DELETE SET NULL,
  
  -- Content
  post_type TEXT NOT NULL CHECK (post_type IN ('update', 'offer', 'event')),
  text_content TEXT NOT NULL,
  image_url TEXT, -- Permanent Supabase Storage URL
  image_prompt TEXT, -- Original prompt used for image generation
  
  -- Scheduling
  scheduled_date DATE,
  scheduled_time TIME,
  
  -- Workflow Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'scheduled', 'published', 'failed')),
  
  -- GBP Integration
  gbp_post_id TEXT, -- ID returned by GBP API after publishing
  published_at TIMESTAMPTZ,
  
  -- Performance Metrics (fetched from GBP API)
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  
  -- Metadata
  rejection_reason TEXT, -- If admin rejects
  generation_metadata JSONB -- {provider: "google", model: "imagen-3", tokens_used: 100}
);

CREATE INDEX IF NOT EXISTS idx_content_posts_client ON public.content_posts(client_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_status ON public.content_posts(status);
CREATE INDEX IF NOT EXISTS idx_content_posts_scheduled ON public.content_posts(scheduled_date, scheduled_time) WHERE scheduled_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_posts_created_at ON public.content_posts(created_at DESC);

CREATE TRIGGER update_content_posts_updated_at
  BEFORE UPDATE ON public.content_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 4: notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Target
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Admin receiving notification
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE, -- Related client (if applicable)
  
  -- Notification Details
  type TEXT NOT NULL CHECK (type IN ('report_due', 'content_approval_needed', 'review_response_needed', 'oauth_expired')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT, -- Link to relevant page (e.g., /dashboard/reports/generate?client=xxx)
  
  -- Status
  read BOOLEAN DEFAULT FALSE,
  completed BOOLEAN DEFAULT FALSE, -- User took action
  snoozed_until TIMESTAMPTZ,
  
  -- Delivery
  sent_via_email BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_client ON public.notifications(client_id) WHERE client_id IS NOT NULL;

-- ============================================================================
-- TABLE 5: magic_links
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.magic_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Token
  token TEXT UNIQUE NOT NULL, -- UUID or secure random string
  
  -- Related Client
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Expiry & Usage
  expires_at TIMESTAMPTZ NOT NULL, -- Default: 7 days from creation
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  
  -- Pre-fill Data
  prefilled_data JSONB -- Data already entered by agency
);

CREATE INDEX IF NOT EXISTS idx_magic_links_token ON public.magic_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_expires ON public.magic_links(expires_at) WHERE used = FALSE;
CREATE INDEX IF NOT EXISTS idx_magic_links_client ON public.magic_links(client_id);

-- ============================================================================
-- TABLE 6: gbp_oauth_tokens
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.gbp_oauth_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Scope
  scope TEXT NOT NULL CHECK (scope IN ('agency_admin', 'client')),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE, -- NULL if agency_admin
  
  -- OAuth Tokens
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- GBP Account Info
  google_account_email TEXT,
  gbp_location_ids TEXT[], -- Array of location IDs this token can access
  
  -- Status
  is_valid BOOLEAN DEFAULT TRUE,
  last_refresh_attempt TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_gbp_tokens_client ON public.gbp_oauth_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_gbp_tokens_expires ON public.gbp_oauth_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_gbp_tokens_scope ON public.gbp_oauth_tokens(scope);

CREATE TRIGGER update_gbp_oauth_tokens_updated_at
  BEFORE UPDATE ON public.gbp_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 7: monthly_reports
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.monthly_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Relationships
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Report Period
  report_month INTEGER NOT NULL CHECK (report_month >= 1 AND report_month <= 12),
  report_year INTEGER NOT NULL,
  
  -- Metrics (from GBP Insights API)
  metrics JSONB NOT NULL, -- {views, calls, direction_requests, website_clicks, etc.}
  comparison_data JSONB, -- Y-1 comparison if available
  
  -- Files
  pdf_url TEXT, -- Supabase Storage URL
  
  -- Delivery
  sent_to_client BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  sent_via TEXT CHECK (sent_via IN ('email', 'whatsapp', 'manual')),
  
  -- Unique Constraint
  UNIQUE(client_id, report_month, report_year)
);

CREATE INDEX IF NOT EXISTS idx_monthly_reports_client ON public.monthly_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_period ON public.monthly_reports(report_year, report_month);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_created_at ON public.monthly_reports(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gbp_oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

-- Clients: Authenticated users have full access
DROP POLICY IF EXISTS "Authenticated users have full access" ON public.clients;
CREATE POLICY "Authenticated users have full access"
  ON public.clients
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Master Prompts: Authenticated users have full access
DROP POLICY IF EXISTS "Authenticated users have full access" ON public.master_prompts;
CREATE POLICY "Authenticated users have full access"
  ON public.master_prompts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Content Posts: Authenticated users have full access
DROP POLICY IF EXISTS "Authenticated users have full access" ON public.content_posts;
CREATE POLICY "Authenticated users have full access"
  ON public.content_posts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Notifications: Authenticated users can only see their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;
CREATE POLICY "Users can manage their own notifications"
  ON public.notifications
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can create notifications for any user
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Magic Links: Public can read valid, unexpired links (for onboarding)
DROP POLICY IF EXISTS "Public can read valid magic links" ON public.magic_links;
CREATE POLICY "Public can read valid magic links"
  ON public.magic_links
  FOR SELECT
  TO anon
  USING (
    used = FALSE 
    AND expires_at > NOW()
  );

-- Magic Links: Authenticated users can manage all magic links
DROP POLICY IF EXISTS "Authenticated users can manage magic links" ON public.magic_links;
CREATE POLICY "Authenticated users can manage magic links"
  ON public.magic_links
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- GBP OAuth Tokens: Authenticated users have full access
DROP POLICY IF EXISTS "Authenticated users have full access" ON public.gbp_oauth_tokens;
CREATE POLICY "Authenticated users have full access"
  ON public.gbp_oauth_tokens
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Monthly Reports: Authenticated users have full access
DROP POLICY IF EXISTS "Authenticated users have full access" ON public.monthly_reports;
CREATE POLICY "Authenticated users have full access"
  ON public.monthly_reports
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- STORAGE BUCKET: post-images
-- ============================================================================

-- Create the storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  false, -- Private bucket, requires authentication
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for post-images bucket
-- Allow authenticated users to upload
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'post-images');

-- Allow authenticated users to read
DROP POLICY IF EXISTS "Authenticated users can read images" ON storage.objects;
CREATE POLICY "Authenticated users can read images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'post-images');

-- Allow authenticated users to delete
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
CREATE POLICY "Authenticated users can delete images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'post-images');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

