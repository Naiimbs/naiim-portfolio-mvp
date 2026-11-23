/**
 * Safely resolves JSON-array content stored by the custom case-study CMS.
 * Invalid or incomplete editor input never breaks the public case-study page.
 */
export function parseCaseStudyArray(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}
