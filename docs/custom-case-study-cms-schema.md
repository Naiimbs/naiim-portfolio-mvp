# Custom Case Study CMS Sections

The WINNI and Assestini case studies retain their bespoke React components for interactive product demonstrations, diagrams, and visual sequences. The Content Registry can additionally store editorial sections under `metadata.caseStudy.customSections`.

## Schema

```json
{
  "version": 2,
  "type": "custom",
  "title": "Case study title",
  "subtitle": "Case study description",
  "translations": {
    "fr": { "title": "Titre", "subtitle": "Description" },
    "ar": { "title": "العنوان", "subtitle": "الوصف" }
  },
  "customSections": [
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
- Edit English content and French/Arabic translations.
- Set image URL/storage URL, alternative text, caption, and layout.
- Preview saved custom-case-study content using the authenticated admin preview route.

## Rendering and safety

- The registry remains the authoritative content source.
- Public rendering still requires a published + public registry entry.
- Admin preview requires an authenticated admin and uses the existing registry/RLS access path.
- Arabic sections render RTL.
- Image sections use contained media so screenshots are not forcibly cropped.
- Empty or hidden CMS sections are not rendered.
- The existing bespoke components remain active; CMS sections are currently additional editorial blocks placed before the final CTA.

## Current limitation

This schema does not yet expose every string, diagram label, screenshot, or interaction configuration inside the pre-existing WINNI and Assestini React subcomponents. Those internal component fields remain code-defined and require a later component-by-component CMS migration before these bespoke studies are fully editable end-to-end.
