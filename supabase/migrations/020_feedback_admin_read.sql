-- ==============================================================================
-- MIGRATION: 020_feedback_admin_read.sql
-- Description: Let admins read reader feedback (ratings + private comments).
--   post_feedback had INSERT-only RLS (comments private from the public). This
--   adds an admin read policy so the admin "Feedbacks" screen can list them.
--   post_views is already publicly readable.
-- Idempotent.
-- ==============================================================================

DROP POLICY IF EXISTS "Admin can read feedback" ON public.post_feedback;
CREATE POLICY "Admin can read feedback" ON public.post_feedback
  FOR SELECT
  USING (public.is_admin());
