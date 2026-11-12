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

export function createIqraAdminRevokeHandler(
  dependencies: {
    createClientFn?: typeof createClient;
    getEnv?: (name: string) => string | undefined;
  } = {},
) {
  const createClientFn = dependencies.createClientFn ?? createClient;
  const getEnv = dependencies.getEnv ?? ((name: string) => Deno.env.get(name));
  return async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = getEnv("SUPABASE_URL") ?? "";
  const anonKey = getEnv("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Server configuration is incomplete." }, 500);
  }
  if (!token) {
    return jsonResponse({ error: "Authentication is required." }, 401);
  }

  const authClient = createClientFn(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) {
    return jsonResponse({ error: "The current session is not valid." }, 401);
  }

  const adminClient = createClientFn(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: callerProfile, error: callerProfileError } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (callerProfileError) {
    return jsonResponse({ error: "Could not verify the CMS administrator role." }, 500);
  }
  if (callerProfile?.role !== "admin") {
    return jsonResponse({ error: "Only a CMS administrator can revoke IQRA admin access." }, 403);
  }

  let body: { target_user_id?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "A valid JSON body is required." }, 400);
  }

  const targetUserId = typeof body.target_user_id === "string" ? body.target_user_id : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetUserId)) {
    return jsonResponse({ error: "A valid target_user_id is required." }, 400);
  }

  const { data: targetResult, error: targetError } =
    await adminClient.auth.admin.getUserById(targetUserId);
  if (targetError || !targetResult.user) {
    return jsonResponse({ error: "The target account could not be found." }, 404);
  }

  // Delete the grant first: RLS now denies the target immediately, even if their
  // current access token still carries iqra_role=admin.
  const { error: revokeError } = await adminClient
    .from("iqra_admin_grants")
    .delete()
    .eq("user_id", targetUserId);
  if (revokeError) {
    return jsonResponse({ error: "Could not revoke the IQRA administrator grant." }, 500);
  }

  // Auth metadata updates merge fields; set the claim to null explicitly so
  // omission cannot leave a previously stored admin claim active.
  const nextAppMetadata = {
    ...(targetResult.user.app_metadata ?? {}),
    iqra_role: null,
  };
  const { error: metadataError } = await adminClient.auth.admin.updateUserById(
    targetUserId,
    { app_metadata: nextAppMetadata },
  );

  if (metadataError) {
    // Access is already revoked by the missing database grant. A later retry can
    // clean up the stale claim without reopening access.
    return jsonResponse({
      ok: true,
      iqra_access_revoked: true,
      metadata_cleanup_pending: true,
    }, 202);
  }

  return jsonResponse({
    ok: true,
    iqra_access_revoked: true,
    metadata_cleanup_pending: false,
  });
  };
}

if (import.meta.main) {
  Deno.serve(createIqraAdminRevokeHandler());
}
