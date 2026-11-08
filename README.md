# Naïm Bsili — Portfolio & Management Experience Platform

> A multilingual personal portfolio that brings together product design, front-end engineering, low-code, AI experimentation, and practical product building.

**Live website:** [naiimbsili.com](https://naiimbsili.com)  
**Repository:** [Naiimbs/naiim-portfolio-mvp](https://github.com/Naiimbs/naiim-portfolio-mvp)

This repository contains the codebase behind my personal portfolio. It has evolved beyond a static CV into a content-managed digital platform: a place to present selected work, publish resources, share experiments, and explain how ideas move from design to implementation.

---

## What this project is

The portfolio is both a public-facing experience and a working content platform.

- **Portfolio experience** — profile, career story, selected projects, case studies, services, and contact paths.
- **Management Experience Platform (MEP)** — a custom CMS and page-building environment used to manage and evolve the site.
- **Multilingual publishing** — English, French, and Arabic content, including right-to-left presentation.
- **Learning and resources** — structured resources, articles, learning experiences, and reusable material.
- **AI and automation experiments** — agent-related content and integrations exposed through a controlled server-side gateway.

The goal is to keep the public experience clear and editorial while making the underlying content system flexible enough to grow.

## Key capabilities

### Portfolio and storytelling
- Dynamic pages and reusable content sections.
- Project and case-study presentation, including structured content blocks.
- Career and personal-story experiences.
- Responsive layouts for desktop and mobile.
- Search-friendly page metadata and generated SEO routes.

### CMS and page building
- Admin area with authenticated access.
- Content and page management.
- Section-based page composition and configurable layouts.
- Case-study and blog editing workflows.
- Media selection and upload flows.
- Theme, design-token, and custom CSS controls with preview.
- Content registry and publication workflows.

### Multilingual experience
- English, French, and Arabic localization.
- RTL-aware layouts for Arabic.
- Localized page content and metadata.
- Locale validation through a dedicated project script.

### Resources and learning
- Resource library and editorial content.
- Learning experiences with dedicated presentation and playback logic.
- Reusable content structures designed to support future formats.

### AI and integrations
- Server-side MCP gateway architecture.
- Optional upstream integrations such as n8n and Gmail MCP.
- Provider-based AI integration structure.
- Server-side credentials kept outside the browser bundle.

> Integrations depend on the relevant server configuration and upstream services. Their presence in the codebase does not mean every integration is enabled in every deployment.

---

## Technology

| Area | Technology |
| --- | --- |
| Front end | React 18, React DOM |
| Build tooling | Vite 5 |
| Routing | React Router 6 |
| Content and authentication | Supabase |
| Localization | i18next, react-i18next |
| UI foundation | Bootstrap 5, Bootstrap Icons, custom UI components and design tokens |
| Content rendering | Marked, DOMPurify |
| Metadata | React Helmet Async |
| Utilities | JSZip |
| Server-side integration | Node.js, custom API server, MCP gateway |
| Deployment | Docker, Nginx, VPS workflow |

---

## Getting started

### Requirements

- Node.js (use a current LTS release)
- npm
- A Supabase project for the connected CMS and authentication features

### 1. Clone the repository

```bash
git clone https://github.com/Naiimbs/naiim-portfolio-mvp.git
cd naiim-portfolio-mvp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local `.env` file based on `.env.example`.

At minimum, configure the public Supabase project values used by the client:

```env
VITE_SITE_URL=https://your-domain.example
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Optional browser analytics configuration:

```env
VITE_CLARITY_PROJECT_ID=
```

Optional server-side integrations are documented in `.env.example`. Keep all private tokens and upstream credentials server-side. **Never expose a Supabase service-role key or MCP access token through a `VITE_` variable.**

### 4. Start the development server

```bash
npm run dev
```

Vite starts the local development server at [http://localhost:5173](http://localhost:5173).

### 5. Build for production

```bash
npm run build
npm run preview
```

The production build also runs the SEO page-generation script.

---

## Project scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the application and generate SEO pages |
| `npm run preview` | Preview the production build locally |
| `npm run validate:i18n` | Validate locale resources |
| `npm run test:case-study-stages` | Run case-study stage checks |
| `npm run test:learning-experience` | Run learning-experience checks |
| `npm run test:learning-player` | Run learning-player checks |
| `npm run api` | Start the standalone API server |
| `npm run mcp:check` | Check MCP gateway configuration |

---

## Repository structure

The codebase is organized around the public experience, the admin/CMS environment, reusable UI foundations, and service integrations.

```text
.
├── admin/          # Admin workspace, CMS editors, content management
├── assets/         # Project assets and static resources
├── docs/           # Supporting project documentation
├── legacy/         # Retained legacy implementation
├── public/         # Public static files and route metadata
├── scripts/        # Build, SEO, localization and test scripts
├── server/         # API server and server-side MCP gateway
├── services/       # CMS, content, media, resources and integrations
├── src/            # Application components, routes and feature modules
├── styles/         # Global styles and feature-specific stylesheets
├── supabase/       # Supabase configuration and migrations
├── ui/             # Shared UI components, primitives and theme system
├── App.jsx         # Application composition
├── index.html      # Vite HTML entry point
├── package.json    # Dependencies and project scripts
└── vite.config.js  # Vite configuration
```

---

## Architecture principles

- **Content-driven:** pages and editorial content should be manageable without editing application code for every update.
- **Reusable by design:** shared sections, UI primitives, editors, and theme tokens reduce duplication.
- **Localization-aware:** language and text direction are treated as part of the experience, not as a late translation layer.
- **Secure integration boundaries:** private credentials and upstream service calls belong on the server.
- **Incremental evolution:** new capabilities should extend the existing application rather than replace its architecture unnecessarily.

## Deployment

The repository includes a Docker-based deployment setup and Nginx configuration for serving the built application. Deployment scripts and operational notes are maintained alongside the application.

Production deployment requires correctly configured environment variables and the corresponding Supabase and server-side services. Do not commit local `.env` files, private credentials, or production secrets.

## Current scope and status

This is an actively evolving personal platform. Features and integrations may have different levels of readiness depending on the active deployment and its configuration. The README describes the architecture and capabilities represented in the repository; it should not be read as a claim that every optional integration is enabled publicly.

## About

**Naïm Bsili**  
Senior UX/UI Designer · AI Product Builder

I work across product design, front-end implementation, low-code platforms, and AI-assisted workflows. I enjoy understanding complex problems, shaping useful experiences, and building systems that make ideas tangible.

- Website: [naiimbsili.com](https://naiimbsili.com)
- LinkedIn: [Connect with me](https://www.linkedin.com/)
- GitHub: [Naiimbs](https://github.com/Naiimbs)

---

*Designed, built, and continuously refined by Naïm Bsili.*
