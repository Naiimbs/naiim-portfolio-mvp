# MHAF Production Verification — 2026-10-23

## Verified public endpoint

- The production origin <https://mhaf.naiimbsili.com/> opened successfully in the browser and returned HTTP 200 in a direct request. The page describes a public product for configuring and integrating an accessibility-support widget, with a self-serve workspace and a guided demo option.
- The public installation section is at <https://mhaf.naiimbsili.com/#install>. It states that a client receives a unique Site ID and generated script from the private Admin workspace, and that website domain ownership is verified with a TXT record before widget configuration is published. The visible example uses generic placeholders, not a customer Site ID or private URL.
- The public page explicitly says MHAF improves usability but does not make a website fully WCAG compliant. Its FAQ says it does not replace semantic HTML, keyboard-accessible interactions, contrast, captions, alt text, or a full WCAG review. Do not make compliance, audit-score, adoption, or business-impact claims without separate evidence.
- The live page describes visitor controls for content scale, readable font, spacing, contrast, reading guide, reduced motion, link outlines, and keyboard navigation, plus starter profiles. These are product-page descriptions, not measured impact claims.

## Repository checks

The selected repository `Naiimbs/mhaf-accessibility-saas` documents `https://mhaf.naiimbsili.com` as the production domain in `docs/admin-and-vps-deploy.md`. The customer dashboard source generates an ES-module script with a per-site Site ID and configuration endpoint. The public product origin is consistent across the live page, deployment documentation, and widget source.

## Fresh screenshot evidence and limitations

Fresh public captures were saved as `08-mhaf-production-widget-closed.png`, `09-mhaf-production-widget-open.png`, `10-mhaf-production-installation-guide.png`, `11-mhaf-production-widget-mobile-open.png`, and `12-mhaf-production-widget-mobile-closed.png` in `/home/ubuntu/mhaf-accessibility-screenshots/`. The mobile viewport had no horizontal overflow. The installation snippet visibly uses placeholders.

During the automated visit, the configuration request returned HTTP 403, and the widget loader displayed its safe defaults. The launcher and panel loaded, but these screenshots do not demonstrate a particular verified site's custom settings. They are suitable evidence of the public production interface and fallback view, not evidence of WCAG conformance or customer impact.

The original authenticated captures `03-mhaf-dashboard.webp` and `04-site-details-installation.webp` contain signed-in account identity and site/workspace identifiers; they are retained for private review only and are not suitable for public portfolio use as-is. The original `07-mhaf-magicui-mcp-manus.png` composite also contains signed-in workspace information and unverified readiness/control-count badges; do not post it publicly. The replacement `13-mhaf-magicui-mcp-manus-public.png` is a sanitized conceptual workflow explainer based on the public widget visual; it is not a literal screenshot of the product or evidence of a customer configuration.

## Portfolio publication state

The `mhaf-accessibility` Content Registry row was verified as `published/public`, unfeatured, at `/work/mhaf-accessibility` on 2026-10-23. The renderer and referenced images are on the portfolio feature branch; the production site still requires deployment before the route can be validated end-to-end.

## Public installation example checked for the case study

Source: <https://mhaf.naiimbsili.com/#install>. The public page provides a generic ES-module example and documents TXT verification before a per-site configuration is published. The example intentionally uses placeholders; no customer Site ID or backend schema is published there.

```html
<script type="module"
  src="https://mhaf.naiimbsili.com/widgets/mhaf/mhaf.js"
  data-site-id="generated-in-admin"
  data-config-url="https://YOUR_PROJECT.supabase.co/functions/v1/mhaf-widget-config"
  defer
></script>
```

The product page also lists 12 visitor controls covering reading, text size and typography, spacing, contrast, reading focus, motion, visible interactive elements, and keyboard navigation. It describes four starter profiles as optional starting points that visitors can refine. These are product-page descriptions, not evidence of measured accessibility outcomes or conformance.
