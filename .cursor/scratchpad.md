# RaiseMed OS - Architecture & Implementation Guide

## Project Overview

**RaiseMed OS** is an internal SaaS/ERP platform for managing Google Business Profile (GBP) optimization at scale. It replaces manual workflows (Canva, Word, Email) with a centralized, AI-powered, automated system.

---

## Core Principles

### 1. Client Identity Database (Single Source of Truth)
- All client data stored in structured PostgreSQL tables
- No more static PDFs or scattered documents
- Dynamic data injection into AI prompts and reports

### 2. AI Gateway Architecture (Provider Agnostic)
- **Constraint:** Must support multiple AI providers without code rewrites
- **Implementation:** Adapter pattern with `ImageGeneratorAdapter` interface
- **Initial Provider:** Google Vertex AI (Imagen) - free credits available
- **Future Providers:** OpenAI DALL-E, Stability AI, Flux, etc.
- **Control:** Environment variable `AI_IMAGE_PROVIDER=GOOGLE|OPENAI|STABILITY`

### 3. Image Persistence Strategy
- **Problem:** Generated image URLs often expire
- **Solution:** Own the data via Supabase Storage
- **Workflow:**
  1. AI generates image (temporary URL)
  2. Download to server memory
  3. Upload to Supabase Storage bucket `post-images`
  4. Store permanent URL in `content_posts.image_url`

### 4. Human-in-the-Loop (HITL)
- AI proposes, human approves
- No auto-posting without validation
- Edit/Regenerate capabilities at every step

### 5. ADHD-Friendly UX
- Proactive notifications (system initiates, not user)
- Single-click actions
- Visual status indicators
- Minimal cognitive load

---

## Database Schema (Supabase PostgreSQL)

### Table 1: `clients` (The Source of Truth)

**Purpose:** Replaces static audit PDFs with dynamic structured data.

```sql
CREATE TABLE clients (
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
  monthly_report_day INTEGER DEFAULT 1, -- Day of month to generate report (1-28)
  
  -- Metadata
  notes TEXT,
  audit_data JSONB -- Raw audit data from existing system (backward compatibility)
);
```

**Indexes:**
```sql
CREATE INDEX idx_clients_gbp_location ON clients(gbp_location_id);
CREATE INDEX idx_clients_subscription_status ON clients(subscription_status);
```

---

### Table 2: `content_posts`

**Purpose:** Store all AI-generated GBP posts with approval workflow.

```sql
CREATE TABLE content_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Relationships
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  master_prompt_id UUID REFERENCES master_prompts(id) ON DELETE SET NULL,
  
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
```

**Indexes:**
```sql
CREATE INDEX idx_content_posts_client ON content_posts(client_id);
CREATE INDEX idx_content_posts_status ON content_posts(status);
CREATE INDEX idx_content_posts_scheduled ON content_posts(scheduled_date, scheduled_time);
```

---

### Table 3: `master_prompts`

**Purpose:** Reusable prompt templates with variable injection.

```sql
CREATE TABLE master_prompts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prompt Details
  name TEXT NOT NULL, -- "Weekly Update Template"
  category TEXT NOT NULL CHECK (category IN ('post_text', 'post_image', 'analysis', 'report')),
  prompt_template TEXT NOT NULL, -- "Write a GBP post for {{client.company_name}} targeting {{client.buyer_persona.age_range}}..."
  
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
```

**Indexes:**
```sql
CREATE INDEX idx_master_prompts_category ON master_prompts(category);
CREATE INDEX idx_master_prompts_active ON master_prompts(is_active);
```

---

### Table 4: `notifications`

**Purpose:** Proactive alert system for ADHD-friendly workflow.

```sql
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Target
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Admin receiving notification
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- Related client (if applicable)
  
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
```

**Indexes:**
```sql
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_notifications_type ON notifications(type);
```

---

### Table 5: `magic_links`

**Purpose:** Secure tokenized links for client onboarding.

```sql
CREATE TABLE magic_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Token
  token TEXT UNIQUE NOT NULL, -- UUID or secure random string
  
  -- Related Client
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Expiry & Usage
  expires_at TIMESTAMPTZ NOT NULL, -- Default: 7 days from creation
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  
  -- Pre-fill Data
  prefilled_data JSONB -- Data already entered by agency
);
```

**Indexes:**
```sql
CREATE INDEX idx_magic_links_token ON magic_links(token);
CREATE INDEX idx_magic_links_expires ON magic_links(expires_at) WHERE used = FALSE;
```

---

### Table 6: `gbp_oauth_tokens`

**Purpose:** Store OAuth credentials for GBP API access.

```sql
CREATE TABLE gbp_oauth_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Scope
  scope TEXT NOT NULL CHECK (scope IN ('agency_admin', 'client')),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- NULL if agency_admin
  
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
```

**Indexes:**
```sql
CREATE INDEX idx_gbp_tokens_client ON gbp_oauth_tokens(client_id);
CREATE INDEX idx_gbp_tokens_expires ON gbp_oauth_tokens(expires_at);
```

---

### Table 7: `monthly_reports`

**Purpose:** Track generated reports with metrics.

```sql
CREATE TABLE monthly_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Relationships
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Report Period
  report_month INTEGER NOT NULL, -- 1-12
  report_year INTEGER NOT NULL,
  
  -- Metrics (from GBP Insights API)
  metrics JSONB NOT NULL, -- {views, calls, direction_requests, website_clicks, etc.}
  comparison_data JSONB, -- Y-1 comparison if available
  
  -- Files
  pdf_url TEXT, -- Supabase Storage URL
  
  -- Delivery
  sent_to_client BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  sent_via TEXT, -- "email" | "whatsapp" | "manual"
  
  -- Unique Constraint
  UNIQUE(client_id, report_month, report_year)
);
```

**Indexes:**
```sql
CREATE INDEX idx_monthly_reports_client ON monthly_reports(client_id);
CREATE INDEX idx_monthly_reports_period ON monthly_reports(report_year, report_month);
```

---

## Supabase Storage Buckets

### Bucket: `post-images`

**Purpose:** Store generated images permanently.

**Configuration:**
- Public: `false` (require authentication)
- File size limit: 5MB
- Allowed MIME types: `image/png`, `image/jpeg`, `image/webp`

**RLS Policies:**
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-images');

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can read images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'post-images');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'post-images');
```

---

## Row Level Security (RLS) Policies

### General Strategy
- **Internal tool:** All authenticated users (agency staff) can access all data
- **No client access:** Clients do not have login credentials (magic link forms are public)
- **Future-proof:** RLS structure allows for role-based access if needed

### Policies for Core Tables

**For `clients`, `content_posts`, `master_prompts`, `notifications`, `magic_links`, `gbp_oauth_tokens`, `monthly_reports`:**

```sql
-- Enable RLS
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
CREATE POLICY "Authenticated users have full access"
ON [table_name]
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

**Exception: `magic_links` (public read for onboarding)**

```sql
-- Allow public to read valid, unexpired magic links
CREATE POLICY "Public can read valid magic links"
ON magic_links
FOR SELECT
TO anon
USING (
  used = FALSE 
  AND expires_at > NOW()
);

-- Authenticated users can manage all magic links
CREATE POLICY "Authenticated users can manage magic links"
ON magic_links
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# AI Providers
OPENAI_API_KEY=sk-xxx
AI_IMAGE_PROVIDER=GOOGLE # GOOGLE | OPENAI | STABILITY

# Google Vertex AI (for Imagen)
GOOGLE_CLOUD_PROJECT_ID=xxx
GOOGLE_VERTEX_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Google Business Profile API
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# Email Notifications
EMAIL_API_KEY=re_xxx # Resend API key
EMAIL_FROM=notifications@raisemed.io

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## AI Gateway Architecture

### File: `/src/lib/ai/image-generator.ts`

```typescript
// Adapter Interface
export interface ImageGeneratorAdapter {
  generateImage(prompt: string, config: ImageConfig): Promise<ImageResult>;
  getProviderName(): string;
}

export interface ImageConfig {
  width?: number;
  height?: number;
  style?: string;
  negative_prompt?: string;
}

export interface ImageResult {
  url: string; // Temporary URL
  provider: string;
  model: string;
  metadata?: Record<string, any>;
}

// Factory Function
export function getImageGenerator(): ImageGeneratorAdapter {
  const provider = process.env.AI_IMAGE_PROVIDER || 'GOOGLE';
  
  switch (provider) {
    case 'GOOGLE':
      return new GoogleImagenAdapter();
    case 'OPENAI':
      return new OpenAIImageAdapter();
    case 'STABILITY':
      return new StabilityAIAdapter();
    default:
      throw new Error(`Unknown AI_IMAGE_PROVIDER: ${provider}`);
  }
}

// Usage Example
const generator = getImageGenerator();
const result = await generator.generateImage(prompt, config);
// Then download and upload to Supabase Storage
```

### File: `/src/lib/ai/adapters/google-imagen.ts`

```typescript
export class GoogleImagenAdapter implements ImageGeneratorAdapter {
  async generateImage(prompt: string, config: ImageConfig): Promise<ImageResult> {
    // Implementation using Google Vertex AI Imagen API
    // Returns temporary Cloud Storage URL
  }
  
  getProviderName(): string {
    return 'Google Imagen';
  }
}
```

---

## Image Persistence Workflow

### File: `/src/lib/storage/image-uploader.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { getImageGenerator } from '@/lib/ai/image-generator';

export async function generateAndStoreImage(
  prompt: string,
  clientId: string
): Promise<string> {
  // Step 1: Generate image via adapter
  const generator = getImageGenerator();
  const result = await generator.generateImage(prompt, {
    width: 1200,
    height: 630
  });
  
  // Step 2: Download image to server
  const response = await fetch(result.url);
  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  
  // Step 3: Upload to Supabase Storage
  const fileName = `${clientId}/${Date.now()}.png`;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data, error } = await supabase.storage
    .from('post-images')
    .upload(fileName, buffer, {
      contentType: 'image/png',
      cacheControl: '3600'
    });
  
  if (error) throw error;
  
  // Step 4: Get permanent public URL
  const { data: { publicUrl } } = supabase.storage
    .from('post-images')
    .getPublicUrl(fileName);
  
  return publicUrl; // Store this in content_posts.image_url
}
```

---

## MVP Roadmap Status

- [ ] **Phase 1:** Foundation & Client Identity Database
- [ ] **Phase 2:** Smart Onboarding System
- [ ] **Phase 3:** GBP API Integration & OAuth Setup
- [ ] **Phase 4:** Master Prompts Management
- [ ] **Phase 5:** Content Engine (The Brain)
- [ ] **Phase 6:** Notification Engine
- [ ] **Phase 7:** Monthly Reporting Module

---

## Next Actions

1. ✅ Create this scratchpad
2. ⏳ Run Supabase migration SQL
3. ⏳ Create `.env.local` with all required variables
4. ⏳ Build dashboard shell
5. ⏳ Implement clients CRUD

---

## Notes & Decisions

**Date:** 2025-11-22

- **Decision:** Use Google Vertex AI Imagen initially (free credits)
- **Decision:** Implement adapter pattern for future provider flexibility
- **Decision:** Store images in Supabase Storage (ownership + permanence)
- **Decision:** Human-in-the-loop workflow (no auto-posting)
- **Decision:** Internal tool only (no client portal for MVP)
- **Decision:** Proactive notification system for ADHD-friendly UX

