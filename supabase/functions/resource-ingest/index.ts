import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Or restrict to specific origins in production
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
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
    const payload = await req.json();
    const { action, lead, download } = payload;

    if (action !== "lead_and_download") {
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
