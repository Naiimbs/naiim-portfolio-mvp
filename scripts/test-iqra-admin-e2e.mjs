import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const statusResult = spawnSync('supabase', ['status', '--output-format', 'json'], { encoding: 'utf8' });
assert.equal(statusResult.status, 0, 'Could not read local Supabase status: ' + statusResult.stderr);
const status = JSON.parse(statusResult.stdout);
const env = status.env ?? status;
const apiUrl = env.API_URL;
const anonKey = env.ANON_KEY || env.PUBLISHABLE_KEY;
const jwtSecret = env.JWT_SECRET || status.JWT_SECRET;
assert.ok(apiUrl && anonKey && jwtSecret, 'Local Supabase URL, publishable key and JWT secret are required.');

function issueServiceRoleToken() {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = encode({ alg: 'HS256', typ: 'JWT' }) + '.' + encode({
    aud: 'authenticated',
    exp: now + 600,
    iat: now,
    iss: 'supabase',
    role: 'service_role',
  });
  const signature = createHmac('sha256', jwtSecret).update(unsigned).digest('base64url');
  return unsigned + '.' + signature;
}
const serviceRoleToken = issueServiceRoleToken();

const password = 'Iqra-E2E-' + Date.now() + '-SafePass!';
const users = [];
const headers = (key, token = key) => ({ apikey: key, ...(token ? { Authorization: 'Bearer ' + token } : {}), 'Content-Type': 'application/json' });

async function api(path, options = {}) {
  const method = options.method || 'GET';
  const key = options.key || anonKey;
  const token = options.token === undefined ? serviceRoleToken : options.token;
  const response = await fetch(apiUrl + path, {
    method,
    headers: headers(key, token),
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });
  const raw = await response.text();
  let data;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  return { response, data };
}

async function createUser(label, role, appMetadata = {}) {
  const email = 'iqra-' + label + '-' + Date.now() + '-' + Math.random().toString(16).slice(2) + '@example.test';
  const created = await api('/auth/v1/admin/users', { method: 'POST', body: { email, password, email_confirm: true, app_metadata: appMetadata } });
  assert.equal(created.response.status, 200, 'Create ' + label + ' user: ' + JSON.stringify(created.data));
  const user = created.data.user ?? created.data;
  users.push(user.id);
  const profile = await api('/rest/v1/profiles', { method: 'POST', body: { id: user.id, role } });
  assert.ok(profile.response.ok, 'Create ' + label + ' profile: ' + JSON.stringify(profile.data));
  return { id: user.id, email };
}

async function signIn(user) {
  const signedIn = await api('/auth/v1/token?grant_type=password', { method: 'POST', key: anonKey, token: '', body: { email: user.email, password } });
  assert.equal(signedIn.response.status, 200, 'Sign in ' + user.email + ': ' + JSON.stringify(signedIn.data));
  return signedIn.data.access_token;
}

async function grantExists(userId) {
  const query = new URLSearchParams({ select: 'user_id', user_id: 'eq.' + userId });
  const result = await api('/rest/v1/iqra_admin_grants?' + query);
  assert.equal(result.response.status, 200, 'Read grant: ' + JSON.stringify(result.data));
  return Array.isArray(result.data) && result.data.some((row) => row.user_id === userId);
}

async function getUser(userId) {
  const result = await api('/auth/v1/admin/users/' + userId);
  assert.equal(result.response.status, 200, 'Read auth user: ' + JSON.stringify(result.data));
  return result.data.user ?? result.data;
}

async function invoke(functionName, token, body = {}) {
  return api('/functions/v1/' + functionName, { method: 'POST', key: anonKey, token, body });
}

try {
  const admin = await createUser('cms-admin', 'admin');
  const editor = await createUser('cms-editor', 'editor');
  const target = await createUser('target-admin', 'admin', { theme: 'dark', iqra_role: 'admin' });
  const adminToken = await signIn(admin);
  const editorToken = await signIn(editor);

  const anonymous = await invoke('iqra-admin-bootstrap', '');
  assert.equal(anonymous.response.status, 401);
  const invalid = await invoke('iqra-admin-bootstrap', 'not-a-valid-jwt');
  assert.equal(invalid.response.status, 401);

  const editorBootstrap = await invoke('iqra-admin-bootstrap', editorToken);
  assert.equal(editorBootstrap.response.status, 403);
  assert.equal(await grantExists(editor.id), false);

  const bootstrap = await invoke('iqra-admin-bootstrap', adminToken, { target_user_id: target.id });
  assert.equal(bootstrap.response.status, 200, JSON.stringify(bootstrap.data));
  assert.equal(bootstrap.data.iqra_role, 'admin');
  assert.equal(await grantExists(admin.id), true);
  assert.equal(await grantExists(target.id), false);
  const adminAfterBootstrap = await getUser(admin.id);
  assert.equal(adminAfterBootstrap.app_metadata.iqra_role, 'admin');

  const seedGrant = await api('/rest/v1/iqra_admin_grants', { method: 'POST', body: { user_id: target.id, granted_by: admin.id } });
  assert.ok(seedGrant.response.ok, 'Seed target grant: ' + JSON.stringify(seedGrant.data));
  const editorRevoke = await invoke('iqra-admin-revoke', editorToken, { target_user_id: target.id });
  assert.equal(editorRevoke.response.status, 403);
  assert.equal(await grantExists(target.id), true);

  const revoke = await invoke('iqra-admin-revoke', adminToken, { target_user_id: target.id });
  assert.equal(revoke.response.status, 200, JSON.stringify(revoke.data));
  assert.equal(revoke.data.iqra_access_revoked, true);
  assert.equal(await grantExists(target.id), false);
  const targetAfterRevoke = await getUser(target.id);
  assert.equal('iqra_role' in targetAfterRevoke.app_metadata, false);
  assert.equal(targetAfterRevoke.app_metadata.theme, 'dark');

  console.log('IQRA admin Edge Function E2E passed: anonymous/invalid denial, editor denial, self-only bootstrap, database grant creation, target revocation and metadata preservation.');
} finally {
  for (const userId of users) {
    await api('/auth/v1/admin/users/' + userId, { method: 'DELETE' }).catch(() => {});
  }
}
