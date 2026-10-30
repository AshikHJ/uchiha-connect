-- =================================================================
-- UCHIHA CONNECT STUDIO (UC) — Supabase PostgreSQL Schema Migration
-- Tagline: One Identity. Every Connection.
-- =================================================================

-- 1. Create Enums
CREATE TYPE publication_status_type AS ENUM ('draft', 'published', 'unpublished');

-- 2. Participants Table
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_number INT NOT NULL CHECK (slot_number >= 1 AND slot_number <= 30),
    participant_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    photo_url TEXT,
    headline VARCHAR(255),
    bio TEXT,
    college VARCHAR(255),
    department VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    social_links JSONB DEFAULT '[]'::jsonb,
    projects JSONB DEFAULT '[]'::jsonb,
    skills TEXT[] DEFAULT '{}',
    design_json JSONB,
    template_id VARCHAR(100) DEFAULT 'black-and-orange',
    publication_status publication_status_type DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Templates Table
CREATE TABLE IF NOT EXISTS public.templates (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tagline TEXT,
    category VARCHAR(100) DEFAULT 'Modern',
    thumbnail_preview_color VARCHAR(50),
    theme JSONB NOT NULL,
    default_design JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Studio Settings Table
CREATE TABLE IF NOT EXISTS public.studio_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'primary_config',
    organizer_pin_hash VARCHAR(255) NOT NULL,
    organizer_pin_salt VARCHAR(255) NOT NULL,
    hackathon_name VARCHAR(255) DEFAULT 'UCHIHA CONNECT HACKATHON 2026',
    production_domain VARCHAR(255) DEFAULT 'https://uchihaconnect.com',
    default_template_id VARCHAR(100) DEFAULT 'black-and-orange',
    total_slots INT DEFAULT 30,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Indexes for High Performance Lookups
CREATE INDEX IF NOT EXISTS idx_participants_username ON public.participants (username);
CREATE INDEX IF NOT EXISTS idx_participants_status ON public.participants (publication_status);
CREATE INDEX IF NOT EXISTS idx_participants_slot ON public.participants (slot_number);

-- 6. Row Level Security (RLS)
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_settings ENABLE ROW LEVEL SECURITY;

-- Public Policy: Only published cards are visible to anonymous visitors
CREATE POLICY "Public profiles are visible if published"
ON public.participants
FOR SELECT
TO anon, authenticated
USING (publication_status = 'published');

-- Public Policy: Templates are read-only for public
CREATE POLICY "Public templates are viewable"
ON public.templates
FOR SELECT
TO anon, authenticated
USING (true);

-- Organizer Policy: Full access with Service Role key or Authenticated Admin
CREATE POLICY "Admin full access participants"
ON public.participants
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Admin full access settings"
ON public.studio_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 7. Supabase Storage Bucket Configuration
-- Create storage bucket for participant profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access Profile Photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

CREATE POLICY "Admin Upload Profile Photos"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'profile-photos');
