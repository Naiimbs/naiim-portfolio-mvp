-- 024_normalize_registry_sort_order.sql
-- Every content_registry entry was created with sort_order = 0, which the
-- registry integrity check reports as "Duplicate sort_order 0". Assign a
-- globally distinct sort_order so the warning clears while keeping a sensible
-- grouping: pages first, then case studies, then blog articles, each ordered
-- by publication/creation date. Values are spaced by 10 to leave room for
-- manual reordering.

WITH ordered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      ORDER BY
        CASE content_type
          WHEN 'page' THEN 0
          WHEN 'case-study' THEN 1
          WHEN 'blog' THEN 2
          ELSE 3
        END,
        created_at ASC NULLS LAST,
        title ASC
    ) * 10 AS new_order
  FROM public.content_registry
)
UPDATE public.content_registry c
SET sort_order = o.new_order,
    updated_at = NOW()
FROM ordered o
WHERE c.id = o.id;
