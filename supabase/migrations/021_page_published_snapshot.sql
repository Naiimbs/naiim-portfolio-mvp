-- ==============================================================================
-- MIGRATION: 021_page_published_snapshot.sql
-- Description: Section-level draft/publish for the page builder.
--   The public site renders pages.published_snapshot (a frozen copy of the
--   sections at publish time). The editor keeps editing page_sections (the
--   working/draft copy) freely; "Publish" copies the working sections into
--   published_snapshot. So editing a published page no longer changes the live
--   site until it is republished. Pages published before this column exists
--   (snapshot NULL) keep rendering their live page_sections until first publish.
-- ==============================================================================

ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS published_snapshot JSONB;
