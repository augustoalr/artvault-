-- ArtVault Database Schema
-- Modules: Profiles, Catalog, Inventory, Media, Logs

-- 1. ENUMS & EXTENSIONS
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'conservador', 'visitante');
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- PROFILES: Extends Supabase Auth
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    full_name TEXT,
    role user_role DEFAULT 'visitante' NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ARTWORKS: Core inventory data
CREATE TABLE public.artworks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    inventory_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    year TEXT,
    technique TEXT,
    dimensions TEXT,
    description TEXT,
    status TEXT DEFAULT 'active', -- for soft deletes if preferred over deleted_at, but we'll use deleted_at
    deleted_at TIMESTAMPTZ,
    tags TEXT[], -- basic categorization
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);

-- MEDIA: Track assets associated with artworks
CREATE TABLE public.media_assets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    artwork_id UUID REFERENCES public.artworks(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_type TEXT,
    size_kb INTEGER,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOGS: Historical tracking
CREATE TABLE public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL, -- INSERT, UPDATE, DELETE (SOFT)
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FUNCTIONS & TRIGGERS

-- Function to handle new user registration default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'visitante');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. ROW LEVEL SECURITY (RLS)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Artworks Policies
CREATE POLICY "Artworks viewable by everyone" ON public.artworks
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Editors/Admins can insert artworks" ON public.artworks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

CREATE POLICY "Editors/Admins can update artworks" ON public.artworks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- Admin only direct delete (hard delete)
CREATE POLICY "Admins can delete artworks" ON public.artworks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. SOFT DELETE STRATEGY
-- Instead of deleting, editors set deleted_at.
-- Admins can truly delete or restore.
