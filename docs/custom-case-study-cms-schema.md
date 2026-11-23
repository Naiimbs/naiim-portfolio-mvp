# Custom Case Study CMS Sections

The WINNI and Assestini case studies retain their bespoke React components for interactive product demonstrations, diagrams, and visual sequences. The Content Registry stores additional editorial blocks under `metadata.caseStudy.customSections` and editable copy overrides for selected native sections under `metadata.caseStudy.nativeSections`.

## Schema

```json
{
  "version": 2,
  "type": "custom",
  "title": "Case study title",
  "subtitle": "Case study description",
  "translations": {
    "fr": {
      "title": "Titre",
      "subtitle": "Description",
      "nativeSections": { "problem": { "title": "Titre modifiable" } }
    },
    "ar": {
      "title": "العنوان",
      "subtitle": "الوصف",
      "nativeSections": { "problem": { "title": "عنوان قابل للتحرير" } }
    }
  },
  "nativeSections": {
    "problem": {
      "eyebrow": "02 · THE PROBLEM",
      "title": "Editable heading",
      "lead": "Editable introduction"
    }
  },\n  "customSections": [
    {
      "id": "custom-intro",
      "type": "text",
      "layout": "text",
      "is_visible": true,
      "title": "Section title",
      "body": "Paragraph one\n\nParagraph two",
      "translations": {
        "fr": { "title": "Titre", "body": "Texte" },
        "ar": { "title": "العنوان", "body": "النص" }
      }
    },
    {
      "id": "custom-visual",
      "type": "image",
      "layout": "wide",
      "is_visible": true,
      "title": "Visual evidence",
      "body": "",
      "image": "https://example.supabase.co/storage/v1/object/public/portfolio-media/case-studies/example.webp",
      "alt": "Descriptive alternative text",
      "caption": "Image caption",
      "translations": {
        "fr": { "title": "Visuel", "alt": "Texte alternatif", "caption": "Légende" },
        "ar": { "title": "دليل بصري", "alt": "وصف الصورة", "caption": "تعليق الصورة" }
      }
    }
  ]
}
```

## Supported controls

- Add text and image sections.
- Reorder sections.
- Hide/show sections without deleting their content.
- Edit English content and French/Arabic translations.\n- Edit selected original section headings and copy in the native WINNI and Assestini layouts.
- Set image URL/storage URL, alternative text, caption, and layout.
- Preview saved custom-case-study content using the authenticated admin preview route.

## Rendering and safety

- The registry remains the authoritative content source.
- Public rendering still requires a published + public registry entry.
- Admin preview requires an authenticated admin and uses the existing registry/RLS access path.
- Arabic sections render RTL.
- Image sections use contained media so screenshots are not forcibly cropped.
- Empty or hidden CMS sections are not rendered.
- The existing bespoke components remain active; CMS editorial blocks are placed before the final CTA.\n- Selected native sections now accept CMS overrides for headings, eyebrow labels and primary copy, with FR/AR overrides. The editor currently exposes 12 WINNI sections (Idea, Problem, Product Challenge, Scan Experience, Privacy, Location, Physical Product, Unified System, Visual System, Motion, Scope and Outcome) and 7 Assestini sections (Challenge, Connected Workflow, AI Estimation, Commercial Workflow, Operational Intelligence, AI Agents/MCP and Product Building).

## Current limitation

This is a partial component-level migration, not full end-to-end editability. Other native sections (including WINNI scan screens, physical product, system matrix, visual system, motion, scope and outcome, and Assestini workflow, operational intelligence and product-building sections) still contain code-defined copy. Diagram node labels, card arrays, screenshots/media selection, alt text/captions, and interaction settings also remain code-defined unless managed through the separate editorial block controls. Continue migrating those fields before describing either bespoke study as fully CMS-editable.
