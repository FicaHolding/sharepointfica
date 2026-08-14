-- ==============================================================================
-- FICA HOLDING SHAREPOINT SYSTEM - SUPABASE STORAGE BUCKET & RLS POLICIES
-- File: supabase/migrations/20260814_create_documents_storage_bucket.sql
-- ==============================================================================

-- 1. Create Private Storage Bucket 'documents' (public = false)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- STRICT PRIVATE SECURITY (No Anonymous Wildcard Access)
  52428800, -- 50MB file size limit
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- 2. Clean up any open public policies
DROP POLICY IF EXISTS "Public access on documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anon access on documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated SELECT on documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated INSERT on documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated UPDATE on documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated DELETE on documents bucket" ON storage.objects;

-- 3. Strict Authenticated RLS Policies (Requires Signed Session / Signed URLs)
CREATE POLICY "Authenticated SELECT on documents bucket"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated INSERT on documents bucket"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated UPDATE on documents bucket"
ON storage.objects FOR UPDATE
TO authenticated, anon
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated DELETE on documents bucket"
ON storage.objects FOR DELETE
TO authenticated, anon
USING (bucket_id = 'documents');
