---
name: app-ui-ux-auditor
description: Comprehensive UI/UX, Heuristic Usability, and Responsive Design QA Auditor for web applications and enterprise portals. Use when auditing any web application by URL or live browser session, testing responsive breakpoints (Desktop, Tablet, Mobile), capturing visual screenshot evidence, evaluating UX/UI quality, and generating professional PDF and Excel deliverables.
---

# Web Application UI/UX & Responsive Design QA Auditor

## Purpose & Overview
This skill equips Antigravity to perform rigorous, professional **UI/UX and Responsive Design Audits** on any web application or enterprise portal from a simple prompt (URL + scope: `UI`, `UX`, `Both`, or `Responsive`).

It delivers:
1. **Interactive Browser Inspection**: Real rendering, navigation, and user flow analysis.
2. **Multi-Viewport Screenshot Evidence**: Tested across Desktop (1440×900), Laptop (1024×768), Tablet (768×1024), and Mobile (390×844).
3. **Actionable Findings**: Categorized by severity (P0 Critical, P1 High, P2 Medium, P3 Low) with root causes and exact code/CSS fixes.
4. **Publication-Grade PDF Report**: Clean typography, balanced page budgeting, and embedded screenshot figures without split banners.
5. **Interactive Excel Workbook (.xlsx)**: Complete notes table with embedded screenshot thumbnails and exact image filenames.

👉 **See the complete user guide and prompt cheat sheet:** [README.md](file:///C:/Users/aii/.gemini/config/skills/app-ui-ux-auditor/README.md)

---

## Standard Document Terminology

When presenting this document to stakeholders, the industry standard titles are:
* **English:** *"Product UI/UX & Responsive Design Audit Report"* or *"Enterprise Application Usability & Heuristic Evaluation"*
* **French:** *"Rapport d'Audit UI/UX & Design QA Ergonomique"* or *"Évaluation Heuristique & Revue d'Ergonomie Produit"*
* **General / Technical:** *"Web Application UX/UI Quality Assessment & Responsive Matrix"*

---

## How to Trigger & Scope Prompts

Users can trigger this workflow with concise prompts:

### Examples:
* `Audit https://example.com/app for UI and UX`
* `Run a responsive design QA on https://app.example.com`
* `UI audit only: check component consistency and visual hierarchy on https://app.example.com`
* `UX audit only: audit workflows, forms, and navigation on https://app.example.com`

---

## Step-by-Step Audit Workflow

### Step 1: Progressive Browser Discovery
1. Open the target application in the browser.
2. Progressively map the application hierarchy:
   * Global navigation (Sidebar / Header / Breadcrumbs)
   * Main Dashboard / Overview
   * List Views & Data Tables
   * Modals, Drawers & Creation Forms
   * Asset / Media Managers
   * Notifications & User Profile Menus

### Step 2: Multi-Breakpoint Screenshot Capture
Capture real screenshots across key breakpoints:
* **Desktop Wide:** `1440 × 900`
* **Laptop / Small Desktop:** `1024 × 768`
* **Tablet Portrait:** `768 × 1024`
* **Mobile Handheld:** `390 × 844` or `375 × 812`

### Step 3: Scope-Specific Heuristic Inspection

#### A. When Scope includes `UI` (Visual & Component Design)
* **Visual Hierarchy:** Contrast, heading scales, focal points, whitespace balance.
* **Component Consistency:** Standardized buttons, status badges, inputs, dropdowns, tabs, pagination.
* **Typography & Text Wrapping:** Truncation ellipsis (`...`), font legibility, letter-spacing.
* **Bilingual / Multilingual Support:** Correct `dir="rtl"` alignment on Arabic/Hebrew input fields.
* **Micro-Copy & Grammar:** Typos in headers, button label consistency (`"Create"` vs. `"Save Changes"`).

#### B. When Scope includes `UX` (Workflows & Usability)
* **Information Architecture:** Clear location indicators, logical grouping, no dead ends.
* **Handheld Navigation:** Ensure mobile bottom bars or hamburger drawers have **text labels**, user avatar, and notifications.
* **Forms & Data Entry:** Unsaved changes warnings, sticky footer clearances (`padding-bottom: 80px`), required indicators (`*`).
* **Data-Dense Tables:** Avoid raw body text columns; provide fluid widths, sorting, search, and 3-dot overflow menus on mobile.
* **Feedback & System Status:** Error state clarity, no exposed `"Invalid Date"` or stack traces, accurate notification counters.

#### C. When Scope includes `Responsive QA`
* **Grid Reflow:** Ensure multi-column cards (e.g. Media Center, KPI metric cards) reflow to 1 or 2 columns on mobile instead of squeezing.
* **No Horizontal Overflow:** Eliminate accidental page-level or container horizontal scrollbars.
* **Mobile Filter Adaptation:** Prevent filter dropdowns from collapsing into generic duplicate `"Filter"` buttons.
* **Touch Target Sizing:** Minimum 44×44 CSS px for all clickable/tappable elements.

---

## Deliverables Generation Guidelines

### 1. Markdown Report (`audit_report.md`)
Structure:
1. Executive Summary & Key Metrics
2. Responsive Matrix Table (`✓ Good`, `⚠ Needs Improvement`, `✕ Broken`)
3. Screen-by-Screen Detailed Audits with Embedded Figures
4. Top 20 UX Problems Table (Prioritized by Severity & Impact)
5. Top 10 Quick Wins (High Impact, Low Effort, Zero Rebranding)
6. "Keep — What Already Works" (Strengths)
7. Final Product UX Scorecard (1–10 across 8 dimensions)
8. Phased 5-Sprint Implementation Roadmap

### 2. PDF Report Generation (`generate_pdf.py`)
To avoid empty alert boxes or split banners:
* Apply `page-break-inside: avoid !important; break-inside: avoid !important;` to all alert boxes (`.finding-alert`).
* Apply `max-height: 185px` to `220px` with `object-fit: contain;` on screenshot comparison images.
* Separate major sections with `.page-break { page-break-before: always; break-before: page; }`.
* Run headless Chrome/Edge to generate the PDF:
  ```bash
  chrome.exe --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="output.pdf" "report.html"
  ```

### 3. Excel Workbook Generation (`create_excel_report.py`)
Generate a 3-sheet workbook using `openpyxl` & `Pillow`:
* **Sheet 1 (`Summary & Scorecard`):** Executive overview, dimension scores, responsive matrix.
* **Sheet 2 (`All Audit Notes & Findings`):** All findings with ID, Screen, Severity, Viewport, Issue Title, Description, UX Impact, Recommended Fix, Effort, Image Filename, and **Embedded Screenshot Thumbnail** in Column K.
* **Sheet 3 (`Quick Wins & Roadmap`):** Top 10 quick wins with time estimates and 5-phase sprint roadmap.

---

## Core Golden Rules
1. **Never Rebrand Without Explicit Instruction:** Treat corporate logo, colors, and identity as fixed constraints. Focus 100% on usability and responsiveness.
2. **Real Visual Evidence Only:** Do not hypothesize defects; inspect the live rendered browser session.
3. **Actionable Recommendations:** Provide concrete code, CSS, or architectural fixes for every finding.
