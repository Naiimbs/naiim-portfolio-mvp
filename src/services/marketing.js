import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

const LOCAL_LEADS_KEY = 'portfolio_marketing_leads';
const LOCAL_DOWNLOADS_KEY = 'portfolio_resource_downloads';
const LOCAL_DONATIONS_KEY = 'portfolio_donations';

/**
 * Seed data for development/offline mode
 */
const SEED_LEADS = [
  {
    id: 'lead-1',
    email: 'alex.design@example.com',
    name: 'Alex Vance',
    role: 'Lead Product Designer',
    company: 'Fintech Studio',
    marketing_consent: true,
    consent_at: '2026-10-05T14:30:00Z',
    source: 'resource_download',
    first_seen_at: '2026-10-05T14:30:00Z',
    last_seen_at: '2026-10-06T09:15:00Z',
    downloads_count: 2,
    created_at: '2026-10-05T14:30:00Z',
  },
  {
    id: 'lead-2',
    email: 'sarah.k@enterprise-saas.io',
    name: 'Sarah Kim',
    role: 'Senior QA Engineer',
    company: 'CloudFlow Corp',
    marketing_consent: false,
    consent_at: null,
    source: 'resource_download',
    first_seen_at: '2026-10-06T08:20:00Z',
    last_seen_at: '2026-10-06T08:20:00Z',
    downloads_count: 1,
    created_at: '2026-10-06T08:20:00Z',
  },
];

const SEED_DOWNLOADS = [
  {
    id: 'dl-1',
    lead_id: 'lead-1',
    lead_email: 'alex.design@example.com',
    lead_name: 'Alex Vance',
    resource_id: 'res-app-ui-ux-auditor',
    resource_slug: 'app-ui-ux-auditor',
    resource_type: 'skill',
    asset_name: 'app-ui-ux-auditor.zip',
    source: 'web',
    utm_source: 'twitter',
    utm_medium: 'social',
    utm_campaign: 'agent_skills_launch',
    downloaded_at: '2026-10-05T14:32:00Z',
  },
  {
    id: 'dl-2',
    lead_id: 'lead-2',
    lead_email: 'sarah.k@enterprise-saas.io',
    lead_name: 'Sarah Kim',
    resource_id: 'res-app-ui-ux-auditor',
    resource_slug: 'app-ui-ux-auditor',
    resource_type: 'skill',
    asset_name: 'Audit Notes Template.xlsx',
    source: 'web',
    utm_source: 'linkedin',
    utm_medium: 'post',
    utm_campaign: '',
    downloaded_at: '2026-10-06T08:20:00Z',
  },
];

const SEED_DONATIONS = [
  {
    id: 'don-1',
    payment_id: 'BAQ-882194',
    provider: 'ba9chich',
    amount: 15.0,
    asset: 'DiamondsTND',
    donor_username: 'karim_ux',
    donor_fullname: 'Karim Mansour',
    message: 'Thanks for the awesome UX Auditor skill! Saved us hours.',
    received_at: '2026-10-05T18:40:00Z',
    verification_status: 'verified',
  },
  {
    id: 'don-2',
    payment_id: 'BAQ-882205',
    provider: 'ba9chich',
    amount: 25.0,
    asset: 'DiamondsTND',
    donor_username: 'anonymous',
    donor_fullname: 'Supporter',
    message: 'Great portfolio & AI tools.',
    received_at: '2026-10-06T07:15:00Z',
    verification_status: 'pending_verification',
  },
];

function getLocalLeads() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_LEADS_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('[marketing] LocalStorage read error:', err);
  }
  return SEED_LEADS;
}

function saveLocalLeads(list) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(list));
    }
  } catch (err) {}
}

function getLocalDownloads() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_DOWNLOADS_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {}
  return SEED_DOWNLOADS;
}

function saveLocalDownloads(list) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_DOWNLOADS_KEY, JSON.stringify(list));
    }
  } catch (err) {}
}

function getLocalDonations() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_DONATIONS_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {}
  return SEED_DONATIONS;
}

/**
 * Capture Lead & Record Download Event
 */
export async function captureLeadAndDownload({
  email,
  name,
  role = '',
  company = '',
  marketingConsent = false,
  resourceId,
  resourceSlug,
  resourceType = 'resource',
  assetName = '',
  utmSource = '',
  utmMedium = '',
  utmCampaign = '',
}) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (name || '').trim();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please provide a valid email address.');
  }
  if (!cleanName) {
    throw new Error('Please provide your name.');
  }

  const now = new Date().toISOString();
  let leadId = `lead-${Date.now()}`;
  let leadRecord = null;

  // 1. Database Operations (if Supabase configured)
  if (isSupabaseConfigured && supabase) {
    try {
      const payload = {
        action: 'lead_and_download',
        lead: {
          email: cleanEmail,
          name: cleanName,
          role: role,
          company: company,
          marketing_consent: Boolean(marketingConsent),
          source: 'resource_download'
        },
        download: {
          resource_id: resourceId || resourceSlug,
          resource_slug: resourceSlug,
          resource_type: resourceType,
          asset_name: assetName,
          source: 'web',
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
        }
      };

      const { data, error } = await supabase.functions.invoke('resource-ingest', {
        body: payload
      });

      if (error) {
        throw new Error(error.message || 'Server error during lead capture');
      }
      if (data && data.error === 'rate_limited') {
        throw new Error('Too many requests. Please try again later.');
      }
      if (data && data.error === 'rate_limit_unavailable') {
        throw new Error('Verification service temporarily unavailable. Please try again later.');
      }
      if (data && data.error) {
        throw new Error(data.message || 'Failed to record download.');
      }

      return { success: true, lead: { id: leadId, email: cleanEmail, name: cleanName } };
    } catch (err) {
      console.error('[marketing] Supabase lead capture error:', err);
      // In production / live configured environment, propagate server persistence errors to the UI
      throw err;
    }
  }

  // 2. Offline / LocalStorage Sync
  const leads = getLocalLeads();
  const existingIdx = leads.findIndex((l) => l.email === cleanEmail);
  if (existingIdx >= 0) {
    leadId = leads[existingIdx].id;
    leads[existingIdx] = {
      ...leads[existingIdx],
      name: cleanName || leads[existingIdx].name,
      role: role || leads[existingIdx].role,
      company: company || leads[existingIdx].company,
      last_seen_at: now,
      marketing_consent: marketingConsent || leads[existingIdx].marketing_consent,
      consent_at: marketingConsent ? now : leads[existingIdx].consent_at,
      downloads_count: (leads[existingIdx].downloads_count || 1) + 1,
    };
    leadRecord = leads[existingIdx];
  } else {
    leadRecord = {
      id: leadId,
      email: cleanEmail,
      name: cleanName,
      role,
      company,
      marketing_consent: Boolean(marketingConsent),
      consent_at: marketingConsent ? now : null,
      source: 'resource_download',
      first_seen_at: now,
      last_seen_at: now,
      downloads_count: 1,
      created_at: now,
    };
    leads.unshift(leadRecord);
  }
  saveLocalLeads(leads);

  const downloads = getLocalDownloads();
  downloads.unshift({
    id: `dl-${Date.now()}`,
    lead_id: leadId,
    lead_email: cleanEmail,
    lead_name: cleanName,
    resource_id: resourceId || resourceSlug,
    resource_slug: resourceSlug,
    resource_type: resourceType,
    asset_name: assetName,
    source: 'web',
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    downloaded_at: now,
  });
  saveLocalDownloads(downloads);

  return { success: true, lead: leadRecord };
}

/**
 * Fetch Marketing Leads (Admin)
 */
export async function getMarketingLeads({ search = '', consent = 'all', page = 1, pageSize = 20 } = {}) {
  let leads = getLocalLeads();
  let totalCount = leads.length;

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('marketing_leads')
        .select('*, resource_downloads(count)', { count: 'exact' });

      if (consent === 'granted') {
        query = query.eq('marketing_consent', true);
      } else if (consent === 'denied') {
        query = query.eq('marketing_consent', false);
      }

      if (search && search.trim()) {
        const q = search.trim();
        query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%,company.ilike.%${q}%,role.ilike.%${q}%`);
      }

      query = query.order('created_at', { ascending: false });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (!error && Array.isArray(data)) {
        return {
          data: data.map((item) => ({
            ...item,
            downloads_count: item.resource_downloads?.[0]?.count ?? 1,
          })),
          total: count ?? data.length,
          page,
          pageSize,
        };
      }
    } catch (err) {
      console.warn('[marketing] Supabase getLeads error, using local fallback:', err);
    }
  }

  // Local filtering
  if (consent === 'granted') {
    leads = leads.filter((l) => l.marketing_consent);
  } else if (consent === 'denied') {
    leads = leads.filter((l) => !l.marketing_consent);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    leads = leads.filter(
      (l) =>
        l.email?.toLowerCase().includes(q) ||
        l.name?.toLowerCase().includes(q) ||
        l.company?.toLowerCase().includes(q) ||
        l.role?.toLowerCase().includes(q)
    );
  }

  totalCount = leads.length;
  const start = (page - 1) * pageSize;
  const paginated = leads.slice(start, start + pageSize);

  return {
    data: paginated,
    total: totalCount,
    page,
    pageSize,
  };
}

/**
 * Fetch Resource Download Events (Admin)
 */
export async function getResourceDownloads({ search = '', resourceType = 'all', page = 1, pageSize = 20 } = {}) {
  let downloads = getLocalDownloads();
  let totalCount = downloads.length;

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('resource_downloads')
        .select('*, marketing_leads(name, email, company, role)', { count: 'exact' });

      if (resourceType && resourceType !== 'all') {
        query = query.eq('resource_type', resourceType);
      }

      if (search && search.trim()) {
        const q = search.trim();
        query = query.or(`resource_slug.ilike.%${q}%,asset_name.ilike.%${q}%,utm_source.ilike.%${q}%,utm_campaign.ilike.%${q}%`);
      }

      query = query.order('downloaded_at', { ascending: false });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (!error && Array.isArray(data)) {
        return {
          data: data.map((item) => ({
            ...item,
            lead_name: item.marketing_leads?.name || 'Anonymous',
            lead_email: item.marketing_leads?.email || 'N/A',
            lead_company: item.marketing_leads?.company || '',
          })),
          total: count ?? data.length,
          page,
          pageSize,
        };
      }
    } catch (err) {
      console.warn('[marketing] Supabase getDownloads error:', err);
    }
  }

  // Local filtering
  if (resourceType && resourceType !== 'all') {
    downloads = downloads.filter((d) => d.resource_type === resourceType);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    downloads = downloads.filter(
      (d) =>
        d.resource_slug?.toLowerCase().includes(q) ||
        d.asset_name?.toLowerCase().includes(q) ||
        d.lead_email?.toLowerCase().includes(q) ||
        d.lead_name?.toLowerCase().includes(q) ||
        d.utm_source?.toLowerCase().includes(q)
    );
  }

  totalCount = downloads.length;
  const start = (page - 1) * pageSize;
  const paginated = downloads.slice(start, start + pageSize);

  return {
    data: paginated,
    total: totalCount,
    page,
    pageSize,
  };
}

/**
 * Fetch Supporters / Donations (Admin)
 */
export async function getDonations({ search = '', provider = 'all' } = {}) {
  let donations = getLocalDonations();

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('donations').select('*').order('received_at', { ascending: false });

      if (provider && provider !== 'all') {
        query = query.eq('provider', provider);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        donations = data;
      }
    } catch (err) {
      console.warn('[marketing] Supabase getDonations error:', err);
    }
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    donations = donations.filter(
      (d) =>
        d.donor_fullname?.toLowerCase().includes(q) ||
        d.donor_username?.toLowerCase().includes(q) ||
        d.payment_id?.toLowerCase().includes(q) ||
        d.message?.toLowerCase().includes(q)
    );
  }

  return { data: donations };
}

/**
 * Export Utility: CSV
 */
export function exportToCSV(filename, rows) {
  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const val = row[header] ?? '';
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
