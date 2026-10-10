-- ==============================================================================
-- SUPABASE CMS SCHEMA MIGRATION: 015_rls_security_hardening.sql
-- Description:
--   1. Secure public.is_admin() SECURITY DEFINER function with explicit search_path.
--   2. Replace deprecated auth.role() = 'authenticated' in policies with TO authenticated.
--   3. Apply public.is_admin() correctly for admin-intended policies that previously only checked 'authenticated'.
--   4. Refine anonymous insert GRANTS for marketing_leads and resource_downloads to prevent arbitrary column writes.
-- ==============================================================================

-- 1. Secure the is_admin() function
-- Following Supabase Security best practices: set search_path = '' to prevent path hijacking
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';


-- 2. Refactor Policies for marketing_leads
-- Drop old insecure/deprecated policies
DROP POLICY IF EXISTS "Public can insert leads" ON public.marketing_leads;
DROP POLICY IF EXISTS "Admin full access to leads" ON public.marketing_leads;

-- Admin policy (using TO authenticated and is_admin)
CREATE POLICY "Admin full access to leads"
    ON public.marketing_leads FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Anon insert policy (restricting rows is not needed, column restriction handled by GRANTS)
CREATE POLICY "Public can insert leads"
    ON public.marketing_leads FOR INSERT
    TO anon
    WITH CHECK (true);

-- Explicit GRANTS to restrict anonymous column insertion
REVOKE INSERT ON public.marketing_leads FROM anon;
GRANT INSERT (email, name, role, company, marketing_consent, source, metadata) ON public.marketing_leads TO anon;


-- 3. Refactor Policies for resource_downloads
-- Drop old insecure/deprecated policies
DROP POLICY IF EXISTS "Public can record downloads" ON public.resource_downloads;
DROP POLICY IF EXISTS "Admin full access to downloads" ON public.resource_downloads;

-- Admin policy (using TO authenticated and is_admin)
CREATE POLICY "Admin full access to downloads"
    ON public.resource_downloads FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Anon insert policy
CREATE POLICY "Public can record downloads"
    ON public.resource_downloads FOR INSERT
    TO anon
    WITH CHECK (true);

-- Explicit GRANTS to restrict anonymous column insertion
REVOKE INSERT ON public.resource_downloads FROM anon;
GRANT INSERT (lead_id, resource_id, resource_slug, resource_type, asset_name, source, utm_source, utm_medium, utm_campaign, user_agent, ip_hash) ON public.resource_downloads TO anon;


-- 4. Refactor Policies for donations
-- Drop old insecure/deprecated policies
DROP POLICY IF EXISTS "Admin full access to donations" ON public.donations;
DROP POLICY IF EXISTS "Service role full access to donations" ON public.donations;

-- Admin policy (using TO authenticated and is_admin)
CREATE POLICY "Admin full access to donations"
    ON public.donations FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Service role policy (refactored to use TO service_role if possible, but custom JWT claims are checked here)
-- Using TO service_role is generally safer, but preserving logic:
CREATE POLICY "Service role full access to donations"
    ON public.donations FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
