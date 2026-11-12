import { createClient } from "npm:@supabase/supabase-js@2.109.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Server configuration is incomplete." }, 500);
  }
  if (!token) {
    return jsonResponse({ error: "Authentication is required." }, 401);
  }

  // Verify the caller's JWT with Supabase Auth; never trust a user ID from the request body.
  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) {
    return jsonResponse({ error: "The current session is not valid." }, 401);
  }

  // Service role is used only inside this Edge Function to read the trusted CMS role
  // and update the caller's server-managed app_metadata.
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError) {
    return jsonResponse({ error: "Could not verify the CMS administrator role." }, 500);
  }
  if (profile?.role !== "admin") {
    return jsonResponse({ error: "Only an existing CMS administrator can activate IQRA admin access." }, 403);
  }

  const { data: existingUser, error: existingUserError } =
    await adminClient.auth.admin.getUserById(authData.user.id);
  if (existingUserError || !existingUser.user) {
    return jsonResponse({ error: "Could not load the authenticated account." }, 500);
  }

  // Create the database-backed grant first. IQRA RLS checks this row on every
  // request, so deleting it revokes access immediately even for an unexpired JWT.
  const { error: grantError } = await adminClient
    .from("iqra_admin_grants")
    .upsert(
      { user_id: authData.user.id, granted_by: authData.user.id },
      { onConflict: "user_id" },
    );
  if (grantError) {
    return jsonResponse({ error: "Could not create the IQRA administrator grant." }, 500);
  }

  const nextAppMetadata = {
    ...(existingUser.user.app_metadata ?? {}),
    iqra_role: "admin",
  };
  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    authData.user.id,
    { app_metadata: nextAppMetadata },
  );

  if (updateError) {
    // Compensate so a failed claim update cannot leave an active grant behind.
    await adminClient
      .from("iqra_admin_grants")
      .delete()
      .eq("user_id", authData.user.id);
    return jsonResponse({ error: "Could not activate the IQRA administrator claim." }, 500);
  }

  return jsonResponse({ ok: true, iqra_role: "admin", grant: "active" });
});
