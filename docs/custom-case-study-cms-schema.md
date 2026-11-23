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
  },
  "nativeSectionOrder": ["problem", "idea", "challenge"],
  "nativeSectionVisibility": { "problem": true, "idea": false },
  "customSections": [
    {
      "id": "custom-intro",
      "type": "text",
      "layout": "text",
      "is_visible": true,
      "title": "Section title",
      "body": "Paragraph one\\n\\nParagraph two",
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
- Edit English content and French/Arabic translations.
- Edit selected original section headings and copy in the native WINNI and Assestini layouts.
- Set image URL/storage URL, alternative text, caption, and layout.
- Preview saved custom-case-study content using the authenticated admin preview route.

## Rendering and safety

- The registry remains the authoritative content source.
- Public rendering still requires a published + public registry entry.
- Admin preview requires an authenticated admin and uses the existing registry/RLS access path.
- Arabic sections render RTL.
- Image sections use contained media so screenshots are not forcibly cropped.
- Empty or hidden CMS sections are not rendered.
- The existing bespoke components remain active; CMS editorial blocks are placed before the final CTA.
- Selected native sections now accept CMS overrides for headings, eyebrow labels and primary copy, with FR/AR overrides. The editor currently exposes 12 WINNI sections (Idea, Problem, Product Challenge, Scan Experience, Privacy, Location, Physical Product, Unified System, Visual System, Motion, Scope and Outcome) and 7 Assestini sections (Challenge, Connected Workflow, AI Estimation, Commercial Workflow, Operational Intelligence, AI Agents/MCP and Product Building).

## Current limitation

This is a partial component-level migration, not full end-to-end editability. Native section order and visibility are managed independently from the custom editorial blocks.

- WINNI structured controls include Scan Experience screen labels, System Matrix rows/column labels, Privacy diagram node labels/descriptions/badges, and Visual System color-token/icon arrays.
- Assestini structured controls include AI Estimation highlights/output items, Commercial Workflow steps, the six-stage Connected Workflow SVG labels, Operational Intelligence feature tags/dashboard image + alt text, and MCP architecture nodes.
- Assestini Product Building exposes its five product/UX/AI/systems/build layers, principle badges, editorial quote copy, evidence heading/copy, and closing evidence image + alt text.
- WINNI Physical Product exposes the three product cards (badge, title, image reference, alt text, description and technical specs) plus print-standard and cut-format copy.
- WINNI Location exposes both sides of the surveillance-vs-voluntary-sharing comparison, including headings, explanations, approved/rejected copy examples and their supporting bullet lists.
- Assestini Workflow screenshots can be replaced through the asset registry, with editable alt text.
- The Connected Workflow diagram expects exactly six step objects; invalid or incomplete JSON falls back to the built-in six-stage sequence. Other JSON arrays fall back when parsing fails, and malformed non-object entries are filtered from diagram/token collections.
- Other secondary paragraphs, detailed copy inside remaining diagrams, image selection in other sections, native media captions, and interaction settings remain code-defined.

Continue migrating those fields before describing either bespoke study as fully CMS-editable.
