-- ==============================================================================
-- MIGRATION: 019_blog_engagement.sql
-- Description: Reader engagement for blog articles — view counts and star feedback.
--   * post_views(slug) — incremented via a SECURITY DEFINER RPC so anonymous
--     visitors can bump the counter without direct table write access.
--   * post_feedback(slug, rating 1..5, comment) — anyone can submit; rows are
--     NOT publicly readable (comments stay private to the author/admin). Public
--     pages read only an aggregate (avg + count) via a SECURITY DEFINER RPC.
-- Idempotent.
-- ==============================================================================

-- 1. VIEW COUNTS -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_views (
  slug TEXT PRIMARY KEY,
  views BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read post views" ON public.post_views;
CREATE POLICY "public read post views" ON public.post_views
  FOR SELECT USING (true);
-- No INSERT/UPDATE policy: writes happen only through increment_post_view().

CREATE OR REPLACE FUNCTION public.increment_post_view(p_slug TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v BIGINT;
BEGIN
  IF p_slug IS NULL OR length(p_slug) = 0 OR length(p_slug) > 200 THEN
    RETURN 0;
  END IF;
  INSERT INTO public.post_views (slug, views, updated_at)
  VALUES (p_slug, 1, NOW())
  ON CONFLICT (slug) DO UPDATE SET views = public.post_views.views + 1, updated_at = NOW()
  RETURNING views INTO v;
  RETURN v;
END;
$$;

-- 2. STAR FEEDBACK -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_feedback_slug ON public.post_feedback(slug);

ALTER TABLE public.post_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone may submit a rating (and optional short comment). Rows are private:
-- no SELECT policy, so the anon/public role cannot read back comments.
DROP POLICY IF EXISTS "anyone can submit feedback" ON public.post_feedback;
CREATE POLICY "anyone can submit feedback" ON public.post_feedback
  FOR INSERT
  WITH CHECK (rating BETWEEN 1 AND 5 AND char_length(COALESCE(comment, '')) <= 2000);

CREATE OR REPLACE FUNCTION public.get_post_rating_summary(p_slug TEXT)
RETURNS TABLE(avg_rating NUMERIC, rating_count BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS avg_rating,
         COUNT(*)::bigint AS rating_count
  FROM public.post_feedback
  WHERE slug = p_slug;
$$;

-- Allow the public/anon roles to call the RPCs.
GRANT EXECUTE ON FUNCTION public.increment_post_view(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_post_rating_summary(TEXT) TO anon, authenticated;
