import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { updateContentRegistryEntry, createContentRegistryEntry, deleteContentRegistryEntry } from './contentRegistry.js';
import { RESOURCE_TYPES } from '../config/resourceTypes.js';

/**
 * Normalizes asset download URL generation to force correct filenames.
 * Used to avoid raw UUID filenames during browser downloads.
 */
export function getAssetDownloadUrl(asset) {
  if (!asset) return null;
  
  // If the asset has a proper download_filename or original_filename, we use it
  const downloadName = asset.download_filename || asset.original_filename || asset.name || 'download';
  
  // If it's a Supabase storage URL, we can append the download parameter
  if (asset.file_url && asset.file_url.includes('supabase.co/storage/v1/object/public/')) {
    const url = new URL(asset.file_url);
    url.searchParams.set('download', downloadName);
    return url.toString();
  }
  
  // Return the original URL if we can't transform it safely
  return asset.file_url;
}

export const SEED_RESOURCES = [
  {
    id: 'res-app-ui-ux-auditor',
    slug: 'app-ui-ux-auditor',
    title: 'App UI/UX & Responsive Design QA Auditor',
    resource_type: 'skill',
    status: 'published',
    visibility: 'public',
    featured: true,
    sort_order: 10,
    version: '1.0.0',
    author: 'Naïm Bsili',
    license: 'MIT',
    last_updated: '2026-10-06',
    short_description: 'Autonomous QA agent skill for auditing enterprise web applications, testing multi-breakpoint responsive collapses, and generating publication-grade PDF and Excel deliverables.',
    description: `A battle-tested autonomous Agent Skill designed for Antigravity and compatible AI coding assistants. It executes comprehensive functional, workflow, UX heuristic, and responsive design audits across Desktop (1440px), Laptop (1024px), Tablet (768px), and Mobile (390px) viewports with zero manual screenshot pasting.`,
    purpose: 'Automate enterprise application UI/UX audits, detect hidden responsive collapses, and generate client-ready PDF and Excel QA reports with real visual screenshot evidence.',
    when_to_use: [
      'Auditing enterprise SaaS platforms, CMS portals, or client web applications.',
      'Verifying multi-device responsive behavior (Desktop 1440px, Tablet 768px, Mobile 390px).',
      'Detecting layout clipping, sticky footer occlusion, and naked-icon bottom navigation.',
      'Generating publication-grade PDF reports and Excel workbooks with embedded screenshot thumbnails.',
      'Checking bilingual Arabic/English RTL alignment and input usability.',
    ],
    when_not_to_use: [
      'Auditing native mobile apps (iOS/Android native binaries).',
      'Backend performance load testing or SQL stress testing.',
      'Rebranding corporate visual identity or logos (brand design remains a fixed constraint).',
    ],
    how_to_use: `### Step 1: Triggering the Audit
Provide Antigravity with a URL and define the desired scope:
\`\`\`text
Audit https://cms-unifyapps-dev.modhs.med.sa for both UI and UX with PDF and Excel export.
\`\`\`

### Step 2: Autonomous Execution Pipeline
1. **Live Browser Exploration:** Progressively maps navigation, tables, forms, and drawers.
2. **Multi-Viewport Captures:** Takes real screenshots at 1440×900, 1024×768, 768×1024, and 390×844.
3. **Heuristic Evaluation:** Evaluates cognitive load, filter degradation, touch targets (≥44px), and Arabic RTL.
4. **Deliverable Generation:** Compiles structured findings into a 10-page budgeted PDF and a 3-sheet Excel workbook (.xlsx).`,
    installation: `### 1. Global Skill (All Projects)
Copy the skill directory to your user configuration root:
\`\`\`bash
cp -r app-ui-ux-auditor ~/.gemini/config/skills/app-ui-ux-auditor
\`\`\`

### 2. Workspace Skill (Project Specific)
Place in your repository's agents directory:
\`\`\`bash
cp -r app-ui-ux-auditor .agents/skills/app-ui-ux-auditor
\`\`\`

### 3. Version Control
Commit the folder to Git to share with pair-programming team members.`,
    compatibility: [
      { name: 'Google Antigravity', status: 'verified', notes: 'Full browser subagent and tool integration' },
      { name: 'Claude (Computer Use)', status: 'compatible', notes: 'Compatible with standard browser execution' },
      { name: 'OpenAI Swarm / Custom Agents', status: 'not_verified', notes: 'Requires markdown prompt parsing' },
    ],
    source_url: 'https://github.com/naiimbsili/antigravity-skills',
    repository_url: 'https://github.com/naiimbsili/antigravity-skills/tree/main/skills/app-ui-ux-auditor',
    documentation_url: '/resources/app-ui-ux-auditor',
    external_url: '',
    related_projects: ['winni', 'unifyapps-cms'],
    related_agents: ['design-qa-agent'],
    related_case_studies: ['winni'],
    tags: ['Agent Skill', 'UI/UX Audit', 'Responsive QA', 'Design Systems', 'Automation'],
    bundle_download_url: '/resources/app-ui-ux-auditor/app-ui-ux-auditor.zip',
    assets: [
      {
        id: 'asset-1',
        name: 'SKILL.md',
        asset_type: 'documentation',
        file_url: '/resources/app-ui-ux-auditor/SKILL.md',
        description: 'Core instructions, prompt triggers, YAML metadata, and heuristic rules.',
        is_required: true,
        is_previewable: true,
        is_downloadable: true,
        sort_order: 10,
        mime_type: 'text/markdown',
        file_size: '6.7 KB',
      },
      {
        id: 'asset-2',
        name: 'README.md',
        asset_type: 'documentation',
        file_url: '/resources/app-ui-ux-auditor/README.md',
        description: 'Complete user guide, copy-paste prompts, and deliverable specifications.',
        is_required: false,
        is_previewable: true,
        is_downloadable: true,
        sort_order: 20,
        mime_type: 'text/markdown',
        file_size: '3.4 KB',
      },
      {
        id: 'asset-3',
        name: 'pdf_generator.py',
        asset_type: 'script',
        file_url: '/resources/app-ui-ux-auditor/scripts/pdf_generator.py',
        description: 'Headless Chrome PDF generator with A4 page budgeting and anti-banner-split CSS.',
        is_required: false,
        is_previewable: true,
        is_downloadable: true,
        sort_order: 30,
        mime_type: 'text/x-python',
        file_size: '2.1 KB',
      },
      {
        id: 'asset-4',
        name: 'excel_generator.py',
        asset_type: 'script',
        file_url: '/resources/app-ui-ux-auditor/scripts/excel_generator.py',
        description: 'Python openpyxl automation script for generating multi-sheet workbooks with embedded screenshot thumbnails.',
        is_required: false,
        is_previewable: true,
        is_downloadable: true,
        sort_order: 40,
        mime_type: 'text/x-python',
        file_size: '2.5 KB',
      },
      {
        id: 'asset-5',
        name: 'Audit Notes Template.xlsx',
        asset_type: 'template',
        file_url: '/resources/app-ui-ux-auditor/audit-notes-template.xlsx',
        description: 'Blank, structured 3-sheet audit workbook for recording heuristic findings and embedding visual proof.',
        is_required: false,
        is_previewable: false,
        is_downloadable: true,
        sort_order: 50,
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        file_size: '292 KB',
      },
      {
        id: 'asset-6',
        name: 'Example Audit Report.pdf',
        asset_type: 'example',
        file_url: '/resources/app-ui-ux-auditor/example-audit-report.pdf',
        description: 'Real-world 10-page audit deliverable generated for CMS UnifyApps with embedded cross-device evidence.',
        is_required: false,
        is_previewable: false,
        is_downloadable: true,
        sort_order: 60,
        mime_type: 'application/pdf',
        file_size: '2.3 MB',
      },
      {
        id: 'asset-7',
        name: 'Dashboard Desktop (1440×900)',
        asset_type: 'screenshot',
        file_url: '/resources/app-ui-ux-auditor/screenshots/dashboard-desktop-1440.png',
        description: 'Widescreen overview layout baseline showing Recent Activity table.',
        is_required: false,
        is_previewable: true,
        is_downloadable: true,
        sort_order: 70,
        mime_type: 'image/png',
        file_size: '159 KB',
      },
      {
        id: 'asset-8',
        name: 'Dashboard Mobile (390×844)',
        asset_type: 'screenshot',
        file_url: '/resources/app-ui-ux-auditor/screenshots/dashboard-mobile-390.png',
        description: 'Mobile responsive breakdown showing severe KPI card collision and text truncation.',
        is_required: false,
        is_previewable: true,
        is_downloadable: true,
        sort_order: 80,
        mime_type: 'image/png',
        file_size: '71 KB',
      },
      {
        id: 'asset-9',
        name: 'Media Center Grid Collapse (390×844)',
        asset_type: 'screenshot',
        file_url: '/resources/app-ui-ux-auditor/screenshots/media-mobile-390.png',
        description: 'Mobile 4-column lock bug squeezing asset cards into 80px strips.',
        is_required: false,
        is_previewable: true,
        is_downloadable: true,
        sort_order: 90,
        mime_type: 'image/png',
        file_size: '151 KB',
      },
      {
        id: 'asset-10',
        name: 'Drawer Form Sticky Footer Occlusion',
        asset_type: 'screenshot',
        file_url: '/resources/app-ui-ux-auditor/screenshots/add-page-drawer-form.png',
        description: 'Modal drawer where bottom action buttons obscure lowest form input field.',
        is_required: false,
        is_previewable: true,
        is_downloadable: true,
        sort_order: 100,
        mime_type: 'image/png',
        file_size: '162 KB',
      },
      {
        id: 'asset-11',
        name: 'app-ui-ux-auditor.zip',
        asset_type: 'source',
        file_url: '/resources/app-ui-ux-auditor/app-ui-ux-auditor.zip',
        description: 'Complete offline skill bundle archive containing all markdown, scripts, templates, and screenshots.',
        is_required: true,
        is_previewable: false,
        is_downloadable: true,
        sort_order: 110,
        mime_type: 'application/zip',
        file_size: '3.1 MB',
      },
    ],
  },
];

const LOCAL_STORAGE_KEY = 'portfolio_cms_resources';

function getLocalResources() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item) => {
          const seedMatch = SEED_RESOURCES.find((s) => s.slug === item.slug || s.id === item.id);
          if (seedMatch) {
            const hasAssets = Array.isArray(item.assets) && item.assets.length > 0;
            return {
              ...seedMatch,
              ...item,
              assets: hasAssets ? item.assets : seedMatch.assets,
              when_to_use: item.when_to_use || seedMatch.when_to_use,
              when_not_to_use: item.when_not_to_use || seedMatch.when_not_to_use,
              how_to_use: item.how_to_use || seedMatch.how_to_use,
              installation: item.installation || seedMatch.installation,
              compatibility: item.compatibility || seedMatch.compatibility,
            };
          }
          return item;
        });
      }
    }
  } catch (err) {
    console.warn('[resources] LocalStorage read error:', err);
  }
  return SEED_RESOURCES;
}

function saveLocalResources(list) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    }
  } catch (err) {
    console.warn('[resources] LocalStorage write error:', err);
  }
}

/**
 * Fetch resources for Public display or Admin CMS.
 */
export async function getResources({ type = null, status = null, visibility = null, search = '', featured = null, limit = null } = {}) {
  let list = getLocalResources();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: dbEntries, error } = await supabase
        .from('content_registry')
        .select('*')
        .eq('content_type', 'resource')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(dbEntries) && dbEntries.length > 0) {
        // Merge DB entries with rich local metadata
        list = dbEntries.map((entry) => {
          const seedMatch = SEED_RESOURCES.find((s) => s.slug === entry.slug || s.id === entry.id) || {};
          const meta = entry.metadata || {};
          const assets = (Array.isArray(meta.assets) && meta.assets.length > 0) ? meta.assets : (seedMatch.assets || []);

          return {
            id: entry.id,
            slug: entry.slug,
            title: entry.title || seedMatch.title,
            status: entry.status || 'published',
            visibility: entry.visibility || 'public',
            featured: Boolean(entry.featured ?? seedMatch.featured),
            sort_order: entry.sort_order ?? seedMatch.sort_order ?? 0,
            resource_type: meta.resource_type || seedMatch.resource_type || 'file',
            short_description: meta.short_description || seedMatch.short_description || '',
            description: meta.description || seedMatch.description || '',
            purpose: meta.purpose || seedMatch.purpose || '',
            when_to_use: meta.when_to_use || seedMatch.when_to_use || [],
            when_not_to_use: meta.when_not_to_use || seedMatch.when_not_to_use || [],
            how_to_use: meta.how_to_use || seedMatch.how_to_use || '',
            installation: meta.installation || seedMatch.installation || '',
            compatibility: meta.compatibility || seedMatch.compatibility || [],
            version: meta.version || seedMatch.version || '1.0.0',
            author: meta.author || seedMatch.author || 'Naïm Bsili',
            license: meta.license || seedMatch.license || 'MIT',
            last_updated: meta.last_updated || seedMatch.last_updated || new Date().toISOString().split('T')[0],
            source_url: meta.source_url || seedMatch.source_url || '',
            repository_url: meta.repository_url || seedMatch.repository_url || '',
            documentation_url: meta.documentation_url || seedMatch.documentation_url || '',
            external_url: meta.external_url || seedMatch.external_url || '',
            related_projects: meta.related_projects || seedMatch.related_projects || [],
            related_agents: meta.related_agents || seedMatch.related_agents || [],
            related_case_studies: meta.related_case_studies || seedMatch.related_case_studies || [],
            tags: meta.tags || seedMatch.tags || [],
            bundle_download_url: meta.bundle_download_url || seedMatch.bundle_download_url || '',
            assets,
          };
        });
      }
    } catch (err) {
      console.warn('[resources] Supabase query failed, using local list:', err);
    }
  }

  // Apply in-memory filters
  if (type && type !== 'all') {
    list = list.filter((r) => r.resource_type === type);
  }
  if (status && status !== 'all') {
    list = list.filter((r) => r.status === status);
  }
  if (visibility && visibility !== 'all') {
    list = list.filter((r) => r.visibility === visibility);
  }
  if (featured !== null) {
    list = list.filter((r) => Boolean(r.featured) === Boolean(featured));
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (r) =>
        r.title?.toLowerCase().includes(q) ||
        r.slug?.toLowerCase().includes(q) ||
        r.short_description?.toLowerCase().includes(q) ||
        r.resource_type?.toLowerCase().includes(q) ||
        r.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }

  list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  if (limit) {
    list = list.slice(0, limit);
  }

  return { data: list, error: null };
}

/**
 * Fetch a single resource by slug.
 */
export async function getResourceBySlug(slug) {
  if (!slug) return { data: null, error: new Error('Slug is required') };
  const { data } = await getResources();
  const found = data.find((r) => r.slug === slug.toLowerCase().trim());
  return { data: found || null, error: found ? null : new Error('Resource not found') };
}

/**
 * Fetch a single resource by ID.
 */
export async function getResourceById(id) {
  if (!id) return { data: null, error: new Error('ID is required') };
  const { data } = await getResources();
  const found = data.find((r) => r.id === id);
  return { data: found || null, error: found ? null : new Error('Resource not found') };
}

/**
 * Create or save a new Resource.
 */
export async function createResource(payload) {
  if (payload.resource_type && !RESOURCE_TYPES[payload.resource_type]) {
    return { data: null, error: new Error(`Invalid resource type: ${payload.resource_type}`) };
  }

  const list = getLocalResources();
  const newId = payload.id || `res-${Date.now()}`;
  const slug = (payload.slug || payload.title || 'untitled').toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-');

  const resource = {
    ...payload,
    id: newId,
    slug,
    status: payload.status || 'published',
    visibility: payload.visibility || 'public',
    featured: Boolean(payload.featured),
    sort_order: Number(payload.sort_order) || 10,
    assets: Array.isArray(payload.assets) ? payload.assets : [],
    last_updated: new Date().toISOString().split('T')[0],
  };

  list.push(resource);
  saveLocalResources(list);

  // Sync with Content Registry in Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      await createContentRegistryEntry({
        id: newId,
        title: resource.title,
        slug: resource.slug,
        content_type: 'resource',
        status: resource.status,
        visibility: resource.visibility,
        featured: resource.featured,
        sort_order: resource.sort_order,
        public_route: `/resources/${resource.slug}`,
        metadata: { ...resource },
      });
    } catch (err) {
      console.warn('[resources] Registry sync failed:', err);
    }
  }

  return { data: resource, error: null };
}

/**
 * Update an existing Resource.
 */
export async function updateResource(id, payload) {
  if (payload.resource_type && !RESOURCE_TYPES[payload.resource_type]) {
    return { data: null, error: new Error(`Invalid resource type: ${payload.resource_type}`) };
  }

  let updated = {
    ...payload,
    last_updated: new Date().toISOString().split('T')[0],
  };

  let updateSuccess = false;

  // 1. Sync with Content Registry first (Source of Truth)
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await updateContentRegistryEntry(id, {
        title: updated.title,
        slug: updated.slug,
        status: updated.status,
        visibility: updated.visibility,
        featured: updated.featured,
        sort_order: updated.sort_order,
        public_route: `/resources/${updated.slug}`,
        metadata: { ...updated },
      });
      if (error) {
        if (error.code === 'PGRST116') {
          // If no rows were returned, it might be a seed resource not yet in DB. Let's create it instead.
          const { error: createError } = await createContentRegistryEntry({
            id,
            title: updated.title,
            slug: updated.slug,
            content_type: 'resource',
            status: updated.status,
            visibility: updated.visibility,
            featured: updated.featured,
            sort_order: updated.sort_order,
            public_route: `/resources/${updated.slug}`,
            metadata: { ...updated },
          });
          if (createError) throw createError;
        } else {
          throw error;
        }
      }
      updateSuccess = true;
    } catch (err) {
      console.warn('[resources] Registry update failed:', err);
      return { data: null, error: new Error('Resource could not be updated in the database. Please check the resource ID and try again.') };
    }
  }

  // 2. Update local storage fallback
  const list = getLocalResources();
  const index = list.findIndex((r) => r.id === id);

  if (index !== -1) {
    list[index] = { ...list[index], ...updated };
    saveLocalResources(list);
    updateSuccess = true;
  } else if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Resource not found locally') };
  } else {
    // It exists in Supabase but not locally. Add it locally to keep them in sync.
    list.push({ ...updated, id });
    saveLocalResources(list);
  }

  if (!updateSuccess) {
    return { data: null, error: new Error('Resource could not be updated.') };
  }

  return { data: updated, error: null };
}

/**
 * Delete a Resource.
 */
export async function deleteResource(id) {
  let list = getLocalResources();
  list = list.filter((r) => r.id !== id);
  saveLocalResources(list);

  if (isSupabaseConfigured && supabase) {
    try {
      await deleteContentRegistryEntry(id);
    } catch (err) {
      console.warn('[resources] Registry delete failed:', err);
    }
  }

  return { error: null };
}

/**
 * Toggle Resource publish status.
 */
export async function toggleResourcePublish(id, currentStatus) {
  const nextStatus = currentStatus === 'published' ? 'draft' : 'published';
  return updateResource(id, { status: nextStatus });
}

/**
 * Toggle Resource featured flag.
 */
export async function toggleResourceFeatured(id, currentFeatured) {
  return updateResource(id, { featured: !currentFeatured });
}
