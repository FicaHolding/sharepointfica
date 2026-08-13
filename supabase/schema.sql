-- ==============================================================================
-- FICA HOLDING SHAREPOINT DOCUMENT MANAGEMENT SYSTEM - SUPABASE DATABASE SCHEMA
-- ==============================================================================

-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE PROFILES TABLE (Linked with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff', 'client')) DEFAULT 'staff',
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automatic Profile Creation Trigger on Auth Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, department)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
    'Fica Holding'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. CREATE CLIENTS TABLE
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  folder_name TEXT NOT NULL, -- e.g. '[KH001] - Tập đoàn SunGroup'
  status TEXT NOT NULL CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE FOLDERS TABLE
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. '01_Pháp lý & Hợp đồng'
  is_system_folder BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automatic 4 Subfolders Creation Trigger when a Client is created
CREATE OR REPLACE FUNCTION public.auto_create_client_subfolders()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.folders (client_id, name, is_system_folder, created_by)
  VALUES
    (NEW.id, '01_Pháp lý & Hợp đồng', TRUE, NEW.created_by),
    (NEW.id, '02_Chứng từ & Báo cáo Tài chính', TRUE, NEW.created_by),
    (NEW.id, '03_Dự án Tư vấn & Kiểm toán', TRUE, NEW.created_by),
    (NEW.id, '04_Báo cáo Nghiệm thu', TRUE, NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_create_client_subfolders ON public.clients;
CREATE TRIGGER trigger_auto_create_client_subfolders
  AFTER INSERT ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_client_subfolders();

-- 5. CREATE FILES TABLE
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  current_version INT DEFAULT 1,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT DEFAULT 'application/octet-stream',
  storage_path TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Pending', 'Approved', 'Archived')) DEFAULT 'Approved',
  fiscal_year INT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  service_type TEXT NOT NULL CHECK (service_type IN ('Audit', 'CFO', 'Consulting', 'Legal', 'Tax')) DEFAULT 'Audit',
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE FILE VERSIONS TABLE
CREATE TABLE IF NOT EXISTS public.file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT,
  change_summary TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SUPABASE STORAGE BUCKET CREATION
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;

-- Read Policies (All authenticated users can read)
CREATE POLICY "Allow authenticated read profiles" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read clients" ON public.clients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read folders" ON public.folders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read files" ON public.files FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated read file_versions" ON public.file_versions FOR SELECT USING (auth.role() = 'authenticated');

-- Write Policies for Clients
CREATE POLICY "Allow staff write clients" ON public.clients
  FOR ALL USING (auth.role() = 'authenticated');

-- Read-Only Enforcement Policy for Folders & Files (Locked when Client is Archived)
CREATE POLICY "Allow folder insert if client is active" ON public.folders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_id AND c.status = 'active'
    )
  );

CREATE POLICY "Allow file insert if client is active" ON public.files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_id AND c.status = 'active'
    )
  );

CREATE POLICY "Allow file update if client is active" ON public.files
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_id AND c.status = 'active'
    )
  );

CREATE POLICY "Allow file delete if client is active" ON public.files
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_id AND c.status = 'active'
    )
  );

-- Storage Objects Policies
CREATE POLICY "Allow authenticated upload documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- 9. ENABLE SUPABASE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.folders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.files;
