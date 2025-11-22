# Supabase Requests & Assets Setup

This document contains the SQL statements needed to set up the `requests` and `assets` tables in your Supabase project.

**Project ID:** `xnemdsxpxewvgluhczoh`

---

## Prerequisites

1. You must have already created the `public.profiles` table (see main setup docs)
2. Navigate to your Supabase Dashboard → SQL Editor
3. Copy and paste the SQL statements below

---

## Step 1: Create Tables

### Create `requests` table

```sql
-- Create requests table
CREATE TABLE IF NOT EXISTS public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('brand', 'website', 'product')),
  title text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delivered')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS requests_user_id_idx ON public.requests(user_id);
CREATE INDEX IF NOT EXISTS requests_status_idx ON public.requests(status);
CREATE INDEX IF NOT EXISTS requests_created_at_idx ON public.requests(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE public.requests IS 'Stores design requests (briefs) submitted by users';
COMMENT ON COLUMN public.requests.type IS 'Type of request: brand, website, or product';
COMMENT ON COLUMN public.requests.payload IS 'JSON object containing the full form data submitted by the user';
COMMENT ON COLUMN public.requests.status IS 'Current status: pending, in_progress, completed, or delivered';
```

### Create `assets` table

```sql
-- Create assets table
CREATE TABLE IF NOT EXISTS public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS assets_user_id_idx ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS assets_created_at_idx ON public.assets(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE public.assets IS 'Stores metadata for assets uploaded to Supabase Storage';
COMMENT ON COLUMN public.assets.file_path IS 'Path to the file in Supabase Storage (e.g., "user-id/filename.pdf")';
COMMENT ON COLUMN public.assets.label IS 'User-friendly name for the asset (e.g., "Brand Guidelines v2")';
```

---

## Step 2: Enable Row Level Security (RLS)

```sql
-- Enable RLS on both tables
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
```

---

## Step 3: Create RLS Policies

### Policies for `requests` table

```sql
-- Drop existing policies if any (for clean reinstall)
DROP POLICY IF EXISTS "Users can view their own requests" ON public.requests;
DROP POLICY IF EXISTS "Users can insert their own requests" ON public.requests;
DROP POLICY IF EXISTS "Users can update their own requests" ON public.requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON public.requests;

-- Policy: Users can view their own requests
CREATE POLICY "Users can view their own requests"
ON public.requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can insert their own requests
CREATE POLICY "Users can insert their own requests"
ON public.requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own requests (optional, for editing drafts)
CREATE POLICY "Users can update their own requests"
ON public.requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all requests
CREATE POLICY "Admins can view all requests"
ON public.requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy: Admins can update all requests (change status, etc.)
CREATE POLICY "Admins can update all requests"
ON public.requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);
```

### Policies for `assets` table

```sql
-- Drop existing policies if any (for clean reinstall)
DROP POLICY IF EXISTS "Users can view their own assets" ON public.assets;
DROP POLICY IF EXISTS "Users can insert their own assets" ON public.assets;
DROP POLICY IF EXISTS "Users can delete their own assets" ON public.assets;
DROP POLICY IF EXISTS "Admins can view all assets" ON public.assets;
DROP POLICY IF EXISTS "Admins can insert assets for any user" ON public.assets;
DROP POLICY IF EXISTS "Admins can delete any assets" ON public.assets;

-- Policy: Users can view their own assets
CREATE POLICY "Users can view their own assets"
ON public.assets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can insert their own assets
CREATE POLICY "Users can insert their own assets"
ON public.assets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own assets
CREATE POLICY "Users can delete their own assets"
ON public.assets
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Admins can view all assets
CREATE POLICY "Admins can view all assets"
ON public.assets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy: Admins can insert assets for any user
CREATE POLICY "Admins can insert assets for any user"
ON public.assets
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy: Admins can delete any assets
CREATE POLICY "Admins can delete any assets"
ON public.assets
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);
```

---

## Step 4: Set up Supabase Storage Bucket

The assets table stores metadata, but the actual files live in Supabase Storage.

1. Go to **Storage** in your Supabase Dashboard
2. Create a new bucket named `assets`
3. Set the bucket to **Private** (not public)
4. Set up Storage policies:

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view their own files
CREATE POLICY "Users can view their own assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'assets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view all files
CREATE POLICY "Admins can view all assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'assets' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Allow admins to upload to any folder
CREATE POLICY "Admins can upload assets for any user"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assets' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);
```

---

## Step 5: Verify Setup

Run these queries to verify everything is working:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('requests', 'assets');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('requests', 'assets');

-- Check policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('requests', 'assets');

-- Check storage bucket exists
SELECT * FROM storage.buckets WHERE name = 'assets';
```

---

## Troubleshooting

### Error: "relation 'requests' does not exist"
- Make sure you ran Step 1 in the SQL Editor
- Refresh your Supabase Dashboard

### Error: "new row violates row-level security policy"
- Make sure you ran Step 2 (Enable RLS)
- Make sure you ran Step 3 (Create Policies)
- Verify your user has `is_admin = true` in `profiles` table if testing admin features

### Error: "bucket does not exist"
- Create the `assets` bucket in Storage (Step 4)
- Make sure it's set to Private

### Storage uploads fail with 403
- Make sure you created the Storage policies in Step 4
- Verify the file path follows the pattern: `{user_id}/{filename}`

---

## Data Model Summary

### `requests` table
- Stores brief submissions (Brand, Website, Product forms)
- Users can only see/create their own
- Admins can see/update all

### `assets` table
- Stores metadata about files in Storage
- Points to actual files via `file_path`
- Users can only see/create/delete their own
- Admins can see/create/delete all

### Storage bucket: `assets`
- Stores actual file binaries
- Private bucket with RLS
- File path structure: `{user_id}/{filename}`

---

## Next Steps

After running these SQL statements:

1. Test by logging in as a regular user and submitting a brief
2. Test by logging in as an admin (set `is_admin = true` in profiles)
3. Test asset uploads from the admin panel

If you encounter any errors, check the browser console and Supabase logs.
