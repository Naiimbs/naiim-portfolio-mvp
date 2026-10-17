import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const ALLOWED_ORIGINS = new Set([
  "https://naiimbsili.com",
  "https://www.naiimbsili.com",
  "http://localhost:5173",
  "http://localhost:4173",
]);

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin)
    ? origin
    : "https://naiimbsili.com";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Vary": "Origin",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  };
}

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "10minutemail.com", "guerrillamail.com", "mailinator.com", "tempmail.com",
  "yopmail.com", "getnada.com", "sharklasers.com", "trashmail.com",
  "maildrop.cc", "dispostable.com", "temp-mail.org", "emailondeck.com",
]);

async function validateEmailAddress(value: string) {
  const email = String(value || "").trim().toLowerCase();
  const match = email.match(/^[^\s@]+@([^\s@]+\.[^\s@]{2,})$/);
  if (!match) return { valid: false, email, reason: "format" };

  const domain = match[1];
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return { valid: false, email, reason: "disposable" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`, {
      headers: { accept: "application/dns-json" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const dns = await response.json();
    if (!dns?.Answer?.some((record: { type?: number }) => record.type === 15)) {
      return { valid: false, email, reason: "domain" };
    }
  } catch (_error) {
    return { valid: false, email, reason: "domain_unavailable" };
  }

  return { valid: true, email, reason: null };
}

function errorMessage(reason: string | null) {
  if (reason === "disposable") return "Disposable email addresses are not accepted.";
  if (reason === "domain") return "This email domain cannot receive messages.";
  if (reason === "domain_unavailable") return "Email verification is temporarily unavailable. Please try again.";
  return "Please provide a valid email address.";
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return new Response(JSON.stringify({ error: "origin_not_allowed" }), {
      headers: { ...getCorsHeaders(null), "Content-Type": "application/json" },
      status: 403,
    });
  }
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    const contentLength = Number(req.headers.get("content-length") || "0");
    if (contentLength > 32_768) {
      return new Response(JSON.stringify({ error: "payload_too_large" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 413,
      });
    }
    const payload = await req.json();
    const { action, lead, download } = payload;

    if (action !== "lead_and_download") {
      if (action === "check_lead") {
        const validation = await validateEmailAddress(payload.email);
        if (!validation.valid) {
          return new Response(JSON.stringify({ error: "invalid_email", message: errorMessage(validation.reason) }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 422,
          });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { data: lead, error: leadError } = await supabaseAdmin
          .from("marketing_leads")
          .select("id, name, role, company")
          .eq("email", validation.email)
          .limit(1)
          .maybeSingle();

        if (leadError) throw leadError;
        return new Response(JSON.stringify({
          known: Boolean(lead),
          lead: lead || null,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      return new Response(
        JSON.stringify({
          error: "invalid_request",
          message: "Missing or invalid action",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    if (
      !lead ||
      !lead.email ||
      !lead.name ||
      !download ||
      !download.resource_slug
    ) {
      return new Response(
        JSON.stringify({
          error: "invalid_request",
          message: "Missing required fields",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Normalize
    const email = lead.email.trim().toLowerCase();
    const name = lead.name.trim();
    const role = lead.role ? lead.role.trim() : null;
    const company = lead.company ? lead.company.trim() : null;
    const resourceSlug = download.resource_slug.trim();

    const emailValidation = await validateEmailAddress(email);
    if (!emailValidation.valid) {
      return new Response(JSON.stringify({ error: "invalid_email", message: errorMessage(emailValidation.reason) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 422,
      });
    }

    if (!lead.known_lead && (!lead.first_name?.trim() || !lead.last_name?.trim() || !role)) {
      return new Response(JSON.stringify({ error: "missing_profile", message: "First name, last name, and role are required for a new email." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 422,
      });
    }

    if (email.length > 255 || name.length > 255) {
      return new Response(
        JSON.stringify({
          error: "invalid_request",
          message: "Payload too large",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 413,
        },
      );
    }

    // Initialize Supabase admin client using service_role key
    // This allows bypassing RLS for safe server-side ingestion
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Hash email or IP for rate limiting
    // Note: Edge functions on Supabase reside behind a trusted gateway proxy.
    // x-forwarded-for may contain multiple IPs if passed through multiple proxies.
    // Taking the first IP or raw string.
    const rawIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    // HMAC-SHA256 for IP hashing
    const secret = Deno.env.get("INGEST_HMAC_SECRET");
    if (!secret) {
      console.error("CRITICAL: INGEST_HMAC_SECRET environment variable is missing.");
      return new Response(
        JSON.stringify({ success: false, error: "server_configuration_error" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const ipData = encoder.encode(rawIp);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, ipData);
    const hashArray = Array.from(new Uint8Array(signature));
    const hashedIp = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const rlKey = `rl_${email}`;
    const rlIpKey = `rl_ip_${hashedIp}`;

    const now = new Date().toISOString();

    // Rate Limiting
    const { data: rlData, error: rlError } = await supabaseAdmin.rpc(
      "check_rate_limit",
      {
        p_key: rlIpKey,
        p_limit: 10,
        p_window_minutes: 10,
      },
    );

    if (rlError) {
      console.error("Rate limit check failed:", rlError);
      return new Response(
        JSON.stringify({ success: false, error: "rate_limit_unavailable" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 503,
        },
      );
    }

    if (typeof rlData !== "boolean") {
      console.error("Unexpected rate limit result:", rlData);
      return new Response(
        JSON.stringify({ success: false, error: "rate_limit_unavailable" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 503,
        },
      );
    }

    if (rlData === false) {
      return new Response(
        JSON.stringify({ success: false, error: "rate_limited" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        },
      );
    }

    // Also check email rate limit
    const { data: rlEmailData, error: rlEmailError } = await supabaseAdmin.rpc(
      "check_rate_limit",
      {
        p_key: rlKey,
        p_limit: 5,
        p_window_minutes: 30,
      },
    );

    if (rlEmailError) {
      console.error("Email rate limit check failed:", rlEmailError);
      return new Response(
        JSON.stringify({ success: false, error: "rate_limit_unavailable" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 503,
        },
      );
    }

    if (typeof rlEmailData !== "boolean") {
      console.error("Unexpected email rate limit result:", rlEmailData);
      return new Response(
        JSON.stringify({ success: false, error: "rate_limit_unavailable" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 503,
        },
      );
    }

    if (rlEmailData === false) {
      return new Response(
        JSON.stringify({ success: false, error: "rate_limited" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        },
      );
    }

    // 1. Verify resource exists
    const { data: resource, error: resourceError } = await supabaseAdmin
      .from("content_registry")
      .select("id, slug")
      .eq("slug", resourceSlug)
      .eq("content_type", "resource")
      .eq("status", "published")
      .eq("visibility", "public")
      .single();

    if (resourceError || !resource) {
      return new Response(JSON.stringify({ error: "resource_not_found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // 2. Upsert Lead
    // Using Postgres ON CONFLICT requires the unique constraint on email.
    // Supabase JS insert with upsert: true handles this.
    let leadId = null;
    const { data: upsertedLead, error: leadUpsertError } = await supabaseAdmin
      .from("marketing_leads")
      .upsert(
        {
          email: email,
          name: name,
          role: role,
          company: company,
          marketing_consent: Boolean(lead.marketing_consent),
          consent_at: lead.marketing_consent ? now : null,
          last_seen_at: now,
          source: lead.source
            ? lead.source.substring(0, 50)
            : "resource_download",
        },
        { onConflict: "email" },
      )
      .select("id")
      .single();

    if (leadUpsertError) {
      console.error("Lead upsert failed:", leadUpsertError);
      return new Response(JSON.stringify({ error: "internal_error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    leadId = upsertedLead.id;

    // 3. Insert Download Record
    const { error: downloadError } = await supabaseAdmin
      .from("resource_downloads")
      .insert({
        lead_id: leadId,
        resource_id: resource.id,
        resource_slug: resource.slug,
        resource_type: download.resource_type
          ? download.resource_type.substring(0, 50)
          : "resource",
        asset_name: download.asset_name
          ? download.asset_name.substring(0, 255)
          : null,
        source: download.source ? download.source.substring(0, 50) : "web",
        utm_source: download.utm_source
          ? download.utm_source.substring(0, 100)
          : null,
        utm_medium: download.utm_medium
          ? download.utm_medium.substring(0, 100)
          : null,
        utm_campaign: download.utm_campaign
          ? download.utm_campaign.substring(0, 100)
          : null,
        user_agent: req.headers.get("user-agent")?.substring(0, 255) || null,
        ip_hash: rlIpKey,
        downloaded_at: now,
      });

    if (downloadError) {
      console.error("Download insert failed:", downloadError);
      return new Response(JSON.stringify({ error: "internal_error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
