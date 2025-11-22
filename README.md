# RaiseMed OS

Internal SaaS/ERP platform for managing Google Business Profile (GBP) optimization at scale. Replaces manual workflows (Canva, Word, Email) with a centralized, AI-powered, automated system.

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS + Shadcn/UI
- **Backend/DB:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **AI Integration:** OpenAI API (GPT-4) + Provider-agnostic image generation (Google Vertex AI Imagen initially)
- **External APIs:** Google Business Profile API, Serper (for scraping)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account and project
- OpenAI API key
- Google Cloud Console project (for Vertex AI Imagen)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

Your `.env.local` file should contain:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# AI Providers
OPENAI_API_KEY=sk-xxx
AI_IMAGE_PROVIDER=GOOGLE  # Options: GOOGLE | OPENAI | STABILITY

# Google Vertex AI (for Imagen Image Generation)
GOOGLE_CLOUD_PROJECT_ID=xxx
GOOGLE_VERTEX_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Google Business Profile API
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# Email Notifications
EMAIL_API_KEY=re_xxx  # Resend API key
EMAIL_FROM=notifications@raisemed.io

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Set up the database:

- Open your Supabase project dashboard
- Go to SQL Editor
- Copy and paste the contents of `supabase/raisemed_core_schema.sql`
- Run the SQL script to create all tables, indexes, RLS policies, and storage bucket

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/src
  /app
    /dashboard          # Admin dashboard pages
      /clients          # Client management (Phase 1)
      /content          # Content generation (Phase 5)
      /reports          # Monthly reports (Phase 7)
      /notifications    # Alert center (Phase 6)
      /settings         # GBP OAuth, API keys (Phase 3)
    /onboarding         # Public magic link forms (Phase 2)
    /api                # API routes
  /components
    /dashboard          # Dashboard layout components
    /clients            # Client-related components
    /ui                 # Shadcn/UI components
  /lib
    /ai                 # AI integration (adapter pattern)
    /gbp                # GBP API client
    /supabase           # Supabase helpers
/supabase
  /migrations           # Database migrations
  raisemed_core_schema.sql  # Complete schema (copy to SQL Editor)
```

## MVP Roadmap

- ✅ **Phase 1:** Foundation & Client Identity Database (Current)
- ⏳ **Phase 2:** Smart Onboarding System
- ⏳ **Phase 3:** GBP API Integration & OAuth Setup
- ⏳ **Phase 4:** Master Prompts Management
- ⏳ **Phase 5:** Content Engine (The Brain)
- ⏳ **Phase 6:** Notification Engine
- ⏳ **Phase 7:** Monthly Reporting Module

## Key Features

### Client Identity Database
- Single source of truth for all client data
- Structured storage of buyer persona, tone of voice, competitors
- Subscription management with automated reporting

### AI Gateway Architecture
- Provider-agnostic image generation (Google, OpenAI, Stability)
- Switch providers via environment variable
- Adapter pattern for easy extensibility

### Human-in-the-Loop Workflow
- AI generates content proposals
- Admin reviews and approves before publishing
- Edit/regenerate capabilities at every step

### ADHD-Friendly UX
- Proactive notifications (system initiates actions)
- Single-click actions
- Visual status indicators
- Minimal cognitive load

## Documentation

For detailed architecture and implementation details, see:
- `.cursor/scratchpad.md` - Complete architecture documentation
- `supabase/raisemed_core_schema.sql` - Database schema
