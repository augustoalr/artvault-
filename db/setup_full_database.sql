-- ========================================================
-- ARTVAULT COMPLETE DATABASE SETUP (V2)
-- Generated automatically for project xxakmzbrkqwtbqamsrez
-- ========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'editor', 'conservador', 'visitante', 'seguridad', 'bienes', 'jefe');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movement_request_type') THEN
        CREATE TYPE movement_request_type AS ENUM ('internal', 'external');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movement_request_status') THEN
        CREATE TYPE movement_request_status AS ENUM ('pending', 'pending_bienes', 'pending_chief', 'pending_security', 'authorized', 'rejected');
    END IF;
END $$;

-- 3. TABLES

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    full_name TEXT,
    role user_role DEFAULT 'visitante' NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- APP SETTINGS
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CATALOG OPTIONS
CREATE TABLE IF NOT EXISTS public.catalog_options (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category TEXT NOT NULL,
    value TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ARTWORKS
CREATE TABLE IF NOT EXISTS public.artworks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    inventory_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    year TEXT,
    technique TEXT,
    dimensions TEXT,
    description TEXT,
    status TEXT DEFAULT 'active',
    deleted_at TIMESTAMPTZ,
    tags TEXT[],
    category TEXT,
    artwork_location TEXT,
    entry_date TEXT,
    mounting_description TEXT,
    original_owner TEXT,
    owner_address TEXT,
    provenance TEXT,
    photo_type TEXT,
    photographer TEXT,
    author_biography TEXT,
    biography_researcher TEXT,
    general_observations TEXT,
    registered_by TEXT,
    reviewed_by TEXT,
    completion_percentage INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MEDIA ASSETS
CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    artwork_id UUID REFERENCES public.artworks(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_type TEXT,
    size_kb INTEGER,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MOVEMENT REQUESTS
CREATE TABLE IF NOT EXISTS public.movement_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_number SERIAL,
    movement_type movement_request_type NOT NULL,
    destination TEXT NOT NULL,
    status movement_request_status DEFAULT 'pending',
    purpose TEXT,
    responsible_name TEXT,
    responsible_id_number TEXT,
    security_officer_name TEXT,
    security_officer_id TEXT,
    authorized_at TIMESTAMPTZ,
    authorized_by_user_id UUID REFERENCES auth.users(id),
    bienes_officer_name TEXT,
    bienes_officer_id TEXT,
    bienes_approved_at TIMESTAMPTZ,
    chief_name TEXT,
    chief_id_number TEXT,
    chief_department TEXT,
    chief_authorized_at TIMESTAMPTZ,
    chief_signature_path TEXT,
    artwork_ids UUID[],
    authorized_artwork_ids UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ARTWORK MOVEMENTS
CREATE TABLE IF NOT EXISTS public.artwork_movements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    artwork_id UUID REFERENCES public.artworks(id) ON DELETE CASCADE NOT NULL,
    location TEXT NOT NULL,
    date_from TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    date_to TIMESTAMPTZ,
    notes TEXT,
    request_id UUID REFERENCES public.movement_requests(id),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONSERVATION
CREATE TABLE IF NOT EXISTS public.artwork_conservation (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    artwork_id UUID REFERENCES public.artworks(id) ON DELETE CASCADE NOT NULL,
    conservator_id UUID REFERENCES public.profiles(id),
    diagnosis TEXT,
    recommendations TEXT,
    photo_left_path TEXT,
    photo_right_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VALUATIONS
CREATE TABLE IF NOT EXISTS public.artwork_valuations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    artwork_id UUID REFERENCES public.artworks(id) ON DELETE CASCADE NOT NULL,
    value_usd NUMERIC,
    value_bs NUMERIC,
    appraisal_date DATE,
    registered_by TEXT,
    reviewed_by TEXT,
    approved_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.email), 'visitante')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artwork_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artwork_conservation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artwork_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Public can view active settings" ON public.app_settings;
CREATE POLICY "Public can view active settings" ON public.app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage settings" ON public.app_settings;
CREATE POLICY "Admins can manage settings" ON public.app_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Public can view catalog options" ON public.catalog_options;
CREATE POLICY "Public can view catalog options" ON public.catalog_options FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins/Editors can manage catalog options" ON public.catalog_options;
CREATE POLICY "Admins/Editors can manage catalog options" ON public.catalog_options FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);

DROP POLICY IF EXISTS "Public can view non-deleted artworks" ON public.artworks;
CREATE POLICY "Public can view non-deleted artworks" ON public.artworks FOR SELECT USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Admins/Editors can manage artworks" ON public.artworks;
CREATE POLICY "Admins/Editors can manage artworks" ON public.artworks FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);

DROP POLICY IF EXISTS "Public can view media assets" ON public.media_assets;
CREATE POLICY "Public can view media assets" ON public.media_assets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins/Editors can manage media assets" ON public.media_assets;
CREATE POLICY "Admins/Editors can manage media assets" ON public.media_assets FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);

DROP POLICY IF EXISTS "Movement requests full access for authenticated" ON public.movement_requests;
CREATE POLICY "Movement requests full access for authenticated" ON public.movement_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Artwork movements viewable by authenticated" ON public.artwork_movements;
CREATE POLICY "Artwork movements viewable by authenticated" ON public.artwork_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. STORAGE BUCKETS (artworks & signatures)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('artworks', 'artworks', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies
DROP POLICY IF EXISTS "Public Access to Artworks Bucket" ON storage.objects;
CREATE POLICY "Public Access to Artworks Bucket" ON storage.objects FOR SELECT USING (bucket_id IN ('artworks', 'signatures'));

DROP POLICY IF EXISTS "Allow Upload to Artworks Bucket" ON storage.objects;
CREATE POLICY "Allow Upload to Artworks Bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('artworks', 'signatures'));

DROP POLICY IF EXISTS "Authenticated Users can update images" ON storage.objects;
CREATE POLICY "Authenticated Users can update images" ON storage.objects FOR UPDATE USING (bucket_id IN ('artworks', 'signatures'));

DROP POLICY IF EXISTS "Authenticated Users can delete images" ON storage.objects;
CREATE POLICY "Authenticated Users can delete images" ON storage.objects FOR DELETE USING (bucket_id IN ('artworks', 'signatures'));

-- 7. SEED DATA
INSERT INTO public.catalog_options (id, category, value, is_active) VALUES ('62b94bf4-06ac-40b1-b874-0c1fccef8b83', 'procedencia', 'Compra', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalog_options (id, category, value, is_active) VALUES ('2802dd38-a3ea-47b4-bc9a-a4bedf92ef56', 'categoria', 'Pintura', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalog_options (id, category, value, is_active) VALUES ('9efa4419-6bb9-415d-909b-54d7537cf380', 'investigador', 'Augusto Lopez', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalog_options (id, category, value, is_active) VALUES ('bebb52a3-eacf-4c10-b05d-8ea114b7142d', 'tipo_fotografico', 'Augusto Lopez', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalog_options (id, category, value, is_active) VALUES ('6a898dbf-97e6-4110-8a43-d502ce7b09e9', 'technique', 'Óleo sobre tela', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalog_options (id, category, value, is_active) VALUES ('038b9840-eaf4-46cb-a0a5-48f89a36f896', 'technique', 'Acrílico sobre tela', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalog_options (id, category, value, is_active) VALUES ('f098783a-e82c-4872-b2c4-96c5324299ec', 'provenance', 'Compra', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalog_options (id, category, value, is_active) VALUES ('16227213-6429-448d-a68d-8184d9866e3d', 'provenance', 'Donación', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalog_options (id, category, value, is_active) VALUES ('8ede9323-3662-486c-aa95-90a0e0c53b67', 'category', 'Pintura', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalog_options (id, category, value, is_active) VALUES ('82670957-7c6c-4c64-8d2b-4cd18dec6824', 'category', 'Escultura', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalog_options (id, category, value, is_active) VALUES ('752c5ab0-033e-42d8-a1a5-afbdd9772565', 'technique', 'Madera tallada', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalog_options (id, category, value, is_active) VALUES ('483013e9-17f8-46ba-9bd6-6908fea87760', 'tipo_fotografico', 'Digital', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalog_options (id, category, value, is_active) VALUES ('8d9442bc-58c7-477c-b50b-d03a9a3da7b4', 'investigador', 'Luisa Perez', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalog_options (id, category, value, is_active) VALUES ('cbbe008f-7d8c-401d-815f-7c8597c7a879', 'location', 'Viceministerio para América del Norte', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalog_options (id, category, value, is_active) VALUES ('cdfa6514-25f8-4cdf-9673-cdbbfc880af5', 'location', 'Viceministerio para África', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalog_options (id, category, value, is_active) VALUES ('66768c1c-dd2a-4b8a-8cdb-b0bc7fcfed7c', 'location', 'Viceministerio para Asia medio oriente y oceanía', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalog_options (id, category, value, is_active) VALUES ('3f41eaf7-9e67-4b8d-ad64-3f77db37728b', 'location', 'Deposito piso 11', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalog_options (id, category, value, is_active) VALUES ('af16da6f-f45a-495a-b046-d6cca7f96136', 'location', 'Coordinación de bienes nacionales', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.catalog_options (id, category, value, is_active) VALUES ('ee487477-70b4-4ee8-aa7b-7c93ad686670', 'technique', 'Óleo sobre tabla de álamo', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.app_settings (id, key, value) VALUES ('a74042cc-f3b8-42fc-bceb-9e938bedfb43', 'institution_name', 'Dirección de Patrimonio Cultural') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.app_settings (id, key, value) VALUES ('ba72f5fa-8075-45a1-b867-9563ea5ad045', 'document_title', 'Ficha de registro general') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.app_settings (id, key, value) VALUES ('d92b5c28-6173-4f72-a0be-aaa94c6e1f05', 'institution_logo_url', NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.artworks (id, inventory_number, title, author, year, technique, dimensions, description, status, deleted_at, tags, created_at, updated_at, category, provenance, entry_date, original_owner, owner_address, artwork_location, photo_type, photographer, author_biography, biography_researcher, mounting_description, general_observations, registered_by, reviewed_by, completion_percentage) VALUES ('d6c65278-23f6-4012-9ecf-c681ef624bb4', '1987', 'Augusto André', 'Tico ', '1987', 'Madera tallada', '180 x 75 cm ', NULL, 'active', NULL, NULL, '2026-02-12T09:22:10.900034+00:00', '2026-02-13T11:16:56.255138+00:00', 'Escultura', 'Compra', '2024-06-12', 'MPPRE', NULL, 'Museo de Bellas artes , Sala Armando Reverón', 'Digital', 'Augusto López', 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry''s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.

', 'Luisa Perez', 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry''s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.

', 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry''s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.

', '868f507a-50ae-46dc-aaa2-7d094d5f89bd', 'Gabrinna Castro', 96) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.artworks (id, inventory_number, title, author, year, technique, dimensions, description, status, deleted_at, tags, created_at, updated_at, category, provenance, entry_date, original_owner, owner_address, artwork_location, photo_type, photographer, author_biography, biography_researcher, mounting_description, general_observations, registered_by, reviewed_by, completion_percentage) VALUES ('6da6cf7a-d074-461b-afed-4eff1cc4fe55', '1956', 'Sucre en la batalla', 'Alirio Palacios ', '1965', 'Óleo sobre tela', '100 x 85 cm ', NULL, 'active', NULL, NULL, '2026-02-12T10:17:43.44518+00:00', '2026-08-13T09:20:10.902257+00:00', 'Pintura', 'Donación', '2026-02-02', 'MPPRE', 'Av Baralt', 'Bovedad de Casa Amarilla', 'Digital', 'Augusto López', 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry''s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.

', 'Luisa Perez', 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry''s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.

', 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry''s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.

', '868f507a-50ae-46dc-aaa2-7d094d5f89bd', 'Arnaldo Manzanares', 100) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.artworks (id, inventory_number, title, author, year, technique, dimensions, description, status, deleted_at, tags, created_at, updated_at, category, provenance, entry_date, original_owner, owner_address, artwork_location, photo_type, photographer, author_biography, biography_researcher, mounting_description, general_observations, registered_by, reviewed_by, completion_percentage) VALUES ('d7bfb69d-bebc-4ff7-8bff-7f5e61f4dd49', '54978', 'Simón Bolívar de pie sentado', 'Alirio Palacios ', '1987', 'Acrílico sobre tela ', '120 x 120 cm', 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry''s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.

Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry''s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.

', 'active', NULL, ARRAY['pintura'], '2026-02-11T11:03:39.670814+00:00', '2026-02-13T06:40:52.21473+00:00', 'Pintura', 'Compra', '2026-02-02', 'MPPRE', 'Av Baralt', 'Salón Bolívar ', 'Augusto Lopez', 'Augusto López', 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry''s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.

', 'Augusto Lopez', 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry''s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.

', 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry''s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.

', NULL, 'Gabrinna Castro', 100) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.artworks (id, inventory_number, title, author, year, technique, dimensions, description, status, deleted_at, tags, created_at, updated_at, category, provenance, entry_date, original_owner, owner_address, artwork_location, photo_type, photographer, author_biography, biography_researcher, mounting_description, general_observations, registered_by, reviewed_by, completion_percentage) VALUES ('6a19d916-16de-4f2e-93a2-e6f8ab7c38bb', '45854', 'La mona lisa ', ' Leonardo da Vinci', '1503', 'Óleo sobre tabla de álamo', '150 x 150 cm', NULL, 'active', NULL, NULL, '2026-03-13T09:36:03.199964+00:00', '2026-03-13T11:17:43.651688+00:00', 'Pintura', 'Donación', '2026-03-13', 'Museo de Louvre, París ', 'Av Baralt', 'Boveda 1', 'Augusto Lopez', 'Augusto López', 'Leonardo di ser Piero da Vinci  escuchar (Vinci, 15 de abril de 1452-Amboise, 2 de mayo de 1519),[3]​ más conocido como Leonardo da Vinci, fue un polímata florentino del Renacimiento italiano. Fue a la vez pintor, anatomista, arquitecto, paleontólogo,[4]​botánico, escritor, escultor, filósofo, ingeniero, inventor, músico, poeta y urbanista. Falleció acompañado de Francesco Melzi,[5]​ a quien legó sus proyectos, diseños y pinturas.[3]​ Tras pasar su infancia en su ciudad natal, Leonardo estudió con el pintor florentino Andrea de Verrocchio. Sus primeros trabajos de importancia fueron creados en Milán al servicio del duque Ludovico Sforza. Trabajó a continuación en Roma, Bolonia y Venecia, y pasó sus últimos años en Francia, por invitación del rey Francisco I.', 'Luisa Perez', 'Leonardo di ser Piero da Vinci  escuchar (Vinci, 15 de abril de 1452-Amboise, 2 de mayo de 1519),[3]​ más conocido como Leonardo da Vinci, fue un polímata florentino del Renacimiento italiano. Fue a la vez pintor, anatomista, arquitecto, paleontólogo,[4]​botánico, escritor, escultor, filósofo, ingeniero, inventor, músico, poeta y urbanista. Falleció acompañado de Francesco Melzi,[5]​ a quien legó sus proyectos, diseños y pinturas.[3]​ Tras pasar su infancia en su ciudad natal, Leonardo estudió con el pintor florentino Andrea de Verrocchio. Sus primeros trabajos de importancia fueron creados en Milán al servicio del duque Ludovico Sforza. Trabajó a continuación en Roma, Bolonia y Venecia, y pasó sus últimos años en Francia, por invitación del rey Francisco I.', 'Leonardo di ser Piero da Vinci  escuchar (Vinci, 15 de abril de 1452-Amboise, 2 de mayo de 1519),[3]​ más conocido como Leonardo da Vinci, fue un polímata florentino del Renacimiento italiano. Fue a la vez pintor, anatomista, arquitecto, paleontólogo,[4]​botánico, escritor, escultor, filósofo, ingeniero, inventor, músico, poeta y urbanista. Falleció acompañado de Francesco Melzi,[5]​ a quien legó sus proyectos, diseños y pinturas.[3]​ Tras pasar su infancia en su ciudad natal, Leonardo estudió con el pintor florentino Andrea de Verrocchio. Sus primeros trabajos de importancia fueron creados en Milán al servicio del duque Ludovico Sforza. Trabajó a continuación en Roma, Bolonia y Venecia, y pasó sus últimos años en Francia, por invitación del rey Francisco I.', '868f507a-50ae-46dc-aaa2-7d094d5f89bd', 'Arnaldo Manzanares', 100) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.artworks (id, inventory_number, title, author, year, technique, dimensions, description, status, deleted_at, tags, created_at, updated_at, category, provenance, entry_date, original_owner, owner_address, artwork_location, photo_type, photographer, author_biography, biography_researcher, mounting_description, general_observations, registered_by, reviewed_by, completion_percentage) VALUES ('c5af6a61-7af8-422d-90d7-14eb9bb52ae8', '8854', 'Mona lisa', 'Leonardo da Vinci', '1985', 'Óleo sobre tabla de álamo', '120 x 120 cm ', NULL, 'active', NULL, NULL, '2026-03-13T11:11:41.407811+00:00', '2026-08-13T06:38:04.760912+00:00', 'Pintura', 'Donación', '2026-03-12', 'Museo de Louvre, París ', 'Av Baralt', 'Bovedad de Casa Amarilla', 'Augusto Lopez', 'Augusto López', NULL, NULL, NULL, NULL, '868f507a-50ae-46dc-aaa2-7d094d5f89bd', 'Michale R', 83) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.media_assets (id, artwork_id, storage_path, file_type, size_kb, is_primary) VALUES ('9653562b-4cd8-4065-84aa-385617e4248d', 'd7bfb69d-bebc-4ff7-8bff-7f5e61f4dd49', 'd7bfb69d-bebc-4ff7-8bff-7f5e61f4dd49/1770880599200_primary.jpg', 'image/jpeg', 191, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.media_assets (id, artwork_id, storage_path, file_type, size_kb, is_primary) VALUES ('051426b2-1bd6-4f91-b864-64b94e3fd868', '6da6cf7a-d074-461b-afed-4eff1cc4fe55', '6da6cf7a-d074-461b-afed-4eff1cc4fe55/1770891466598_primary.jpg', 'image/jpeg', 191, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.media_assets (id, artwork_id, storage_path, file_type, size_kb, is_primary) VALUES ('4bb0a8a0-94d4-4f9e-bd06-e49a14827ce6', 'd6c65278-23f6-4012-9ecf-c681ef624bb4', 'd6c65278-23f6-4012-9ecf-c681ef624bb4/1770891504242_primary.jpg', 'image/jpeg', 191, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.media_assets (id, artwork_id, storage_path, file_type, size_kb, is_primary) VALUES ('8530c69c-9ac3-4c88-bdf0-4d8a9299864e', '6a19d916-16de-4f2e-93a2-e6f8ab7c38bb', '6a19d916-16de-4f2e-93a2-e6f8ab7c38bb/1773394561502_primary.jpg', 'image/jpeg', 512, true) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.media_assets (id, artwork_id, storage_path, file_type, size_kb, is_primary) VALUES ('6def3d47-3370-4b1a-8bce-ce3660ffa989', 'c5af6a61-7af8-422d-90d7-14eb9bb52ae8', 'c5af6a61-7af8-422d-90d7-14eb9bb52ae8/1773400301176_primary.jpg', 'image/jpeg', 512, true) ON CONFLICT (id) DO NOTHING;
