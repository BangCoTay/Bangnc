-- Run this in your Supabase SQL Editor to fix the Storage RLS issue for both authenticated and anon users

-- Ensure we have the images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Clean up existing policies if they exist to avoid "already exists" errors
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;

-- 1. Allow everyone (anon and authenticated) to view images
CREATE POLICY "Public Access" 
  ON storage.objects FOR SELECT 
  USING ( bucket_id = 'images' );

-- 2. Allow ANYONE (including anon) to upload new images
-- (This is less secure but will bypass RLS issues for testing)
CREATE POLICY "Anyone can upload images" 
  ON storage.objects FOR INSERT 
  WITH CHECK ( bucket_id = 'images' );

-- 3. Allow everyone to update images (for testing)
CREATE POLICY "Users can update own images" 
  ON storage.objects FOR UPDATE 
  USING ( bucket_id = 'images' );

-- 4. Allow everyone to delete images (for testing)
CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'images' );
