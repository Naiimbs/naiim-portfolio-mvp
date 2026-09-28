-- ==============================================================================
-- SUPABASE CMS MIGRATION: 002_cms_public_renderer.sql
-- Description: Sets up storage bucket policies for 'portfolio-media' and verifies public read policies.
-- ==============================================================================

-- 1. CREATE STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-media', 'portfolio-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. STORAGE POLICIES
DO $$
BEGIN
    -- Public Read Access for portfolio-media bucket
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access to portfolio-media'
    ) THEN
        CREATE POLICY "Public Access to portfolio-media"
            ON storage.objects FOR SELECT
            USING (bucket_id = 'portfolio-media');
    END IF;

    -- Admin full access to portfolio-media bucket
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin manage portfolio-media'
    ) THEN
        CREATE POLICY "Admin manage portfolio-media"
            ON storage.objects FOR ALL
            USING (
                bucket_id = 'portfolio-media' AND
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid() AND role IN ('admin', 'editor')
                )
            );
    END IF;
END $$;
