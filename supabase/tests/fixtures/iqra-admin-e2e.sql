-- Disposable local-only fixture for exercising the actual IQRA admin Edge Functions.
-- IQRA core RLS and CMS role triggers are tested in the companion IQRA repository.

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer'
);

CREATE TABLE IF NOT EXISTS public.iqra_admin_grants (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);

ALTER TABLE public.iqra_admin_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.iqra_admin_grants FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.iqra_admin_grants TO service_role;
