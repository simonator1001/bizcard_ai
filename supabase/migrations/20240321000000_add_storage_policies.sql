-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to upload business cards" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view their own business cards" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own business cards" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own business cards" ON storage.objects;

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-cards', 'business-cards', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create policies for the business-cards bucket
CREATE POLICY "Allow authenticated users to upload business cards"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'business-cards' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow anyone to view business cards"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'business-cards');

CREATE POLICY "Allow users to update their own business cards"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'business-cards' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to delete their own business cards"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'business-cards' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Grant access to the bucket
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO service_role; 