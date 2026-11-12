import assert from "node:assert/strict";
import { createIqraAdminBootstrapHandler } from "../iqra-admin-bootstrap/index.ts";
import { createIqraAdminRevokeHandler } from "../iqra-admin-revoke/index.ts";

function fakeDependencies({
  callerId = "10000000-0000-4000-8000-000000000001",
  callerRole = "admin",
  targetId = "20000000-0000-4000-8000-000000000002",
  targetFound = true,
  validToken = true,
} = {}) {
  const calls: Array<Record<string, unknown>> = [];
  const targetUser = {
    id: targetId,
    app_metadata: { provider: "email", theme: "dark", iqra_role: "admin" },
  };
  const authClient = {
    auth: {
      getUser: async (token: string) => validToken && token === "valid-token"
        ? { data: { user: { id: callerId } }, error: null }
        : { data: { user: null }, error: { message: "invalid token" } },
    },
  };
  const adminClient = {
    from: (table: string) => {
      if (table === "profiles") {
        const query: any = {};
        query.select = (_columns: string) => query;
        query.eq = (_column: string, _value: string) => query;
        query.maybeSingle = async () => ({
          data: { id: callerId, role: callerRole },
          error: null,
        });
        return query;
      }
      if (table === "iqra_admin_grants") {
        return {
          upsert: async (payload: unknown, options: unknown) => {
            calls.push({ action: "grant-upsert", payload, options });
            return { error: null };
          },
          delete: () => ({
            eq: async (column: string, value: string) => {
              calls.push({ action: "grant-delete", column, value });
              return { error: null };
            },
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
    auth: {
      admin: {
        getUserById: async (id: string) => ({
          data: { user: targetFound && id === targetId ? targetUser : null },
          error: targetFound && id === targetId ? null : { message: "not found" },
        }),
        updateUserById: async (id: string, attributes: unknown) => {
          calls.push({ action: "auth-update", id, attributes });
          return { error: null };
        },
      },
    },
  };
  const createClientFn = ((_url: string, key: string) =>
    key === "anon-key" ? authClient : adminClient) as never;
  const getEnv = (name: string) => ({
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_ANON_KEY: "anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-secret",
  } as Record<string, string>)[name];
  return { dependencies: { createClientFn, getEnv }, calls };
}

function request(body?: unknown, token = "valid-token") {
  return new Request("https://example.test/functions/v1/iqra-admin-role", {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

Deno.test("bootstrap rejects anonymous callers", async () => {
  const { dependencies } = fakeDependencies();
  const response = await createIqraAdminBootstrapHandler(dependencies)(request(undefined, ""));
  assert.equal(response.status, 401);
});

Deno.test("bootstrap rejects invalid bearer tokens", async () => {
  const { dependencies } = fakeDependencies({ validToken: false });
  const response = await createIqraAdminBootstrapHandler(dependencies)(request());
  assert.equal(response.status, 401);
});

Deno.test("bootstrap rejects CMS editors without creating a grant", async () => {
  const { dependencies, calls } = fakeDependencies({ callerRole: "editor" });
  const response = await createIqraAdminBootstrapHandler(dependencies)(request({}));
  assert.equal(response.status, 403);
  assert.equal(calls.some((call) => call.action === "grant-upsert"), false);
});

Deno.test("bootstrap grants only the verified CMS admin and preserves app metadata", async () => {
  const { dependencies, calls } = fakeDependencies();
  const response = await createIqraAdminBootstrapHandler(dependencies)(request({}));
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.grant, "active");
  const grantIndex = calls.findIndex((call) => call.action === "grant-upsert");
  const metadataIndex = calls.findIndex((call) => call.action === "auth-update");
  assert.ok(grantIndex >= 0 && metadataIndex > grantIndex);
  const update = calls[metadataIndex].attributes as { app_metadata: Record<string, unknown> };
  assert.equal(update.app_metadata.iqra_role, "admin");
  assert.equal(update.app_metadata.theme, "dark");
});

Deno.test("revoke rejects non-admin callers without touching the target", async () => {
  const { dependencies, calls } = fakeDependencies({ callerRole: "editor" });
  const response = await createIqraAdminRevokeHandler(dependencies)(
    request({ target_user_id: "20000000-0000-4000-8000-000000000002" }),
  );
  assert.equal(response.status, 403);
  assert.equal(calls.some((call) => call.action === "grant-delete"), false);
});

Deno.test("revoke requires a valid target user id", async () => {
  const { dependencies, calls } = fakeDependencies();
  const response = await createIqraAdminRevokeHandler(dependencies)(request({ target_user_id: "not-a-uuid" }));
  assert.equal(response.status, 400);
  assert.equal(calls.some((call) => call.action === "grant-delete"), false);
});

Deno.test("revoke removes the database grant before clearing only the IQRA claim", async () => {
  const { dependencies, calls } = fakeDependencies();
  const response = await createIqraAdminRevokeHandler(dependencies)(
    request({ target_user_id: "20000000-0000-4000-8000-000000000002" }),
  );
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.iqra_access_revoked, true);
  const deleteIndex = calls.findIndex((call) => call.action === "grant-delete");
  const metadataIndex = calls.findIndex((call) => call.action === "auth-update");
  assert.ok(deleteIndex >= 0 && metadataIndex > deleteIndex);
  const update = calls[metadataIndex].attributes as { app_metadata: Record<string, unknown> };
  assert.equal("iqra_role" in update.app_metadata, false);
  assert.equal(update.app_metadata.theme, "dark");
  assert.equal(update.app_metadata.provider, "email");
});
