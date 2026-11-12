import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const app = read('src/App.jsx');
const auth = read('src/admin/context/AuthContext.jsx');
const guard = read('src/admin/components/IqraAdminGuard.jsx');
const courses = read('src/admin/pages/AcademyCourses.jsx');
const curriculum = read('src/admin/pages/AcademyCurriculum.jsx');
const enrollments = read('src/admin/pages/AcademyEnrollments.jsx');
const bootstrap = read('supabase/functions/iqra-admin-bootstrap/index.ts');

for (const route of ['academy', 'academy/courses', 'academy/enrollments', 'academy/courses/:id']) {
  assert.match(app, new RegExp(`path="${route.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}" element={<IqraAdminGuard>`));
}

assert.match(auth, /user\?\.app_metadata\?\.iqra_role === 'admin'/);
assert.match(guard, /if \(!isAdmin\) return <Navigate to="\/admin" replace \/>/);
assert.match(guard, /supabase\.functions\.invoke\('iqra-admin-bootstrap'/);
assert.match(guard, /supabase\.auth\.refreshSession\(\)/);

for (const [name, source] of [['courses', courses], ['curriculum', curriculum], ['enrollments', enrollments]]) {
  assert.doesNotMatch(source, /\.from\('academy_/);
  assert.match(source, /\.from\('iqra_/);
}

assert.match(bootstrap, /authClient\.auth\.getUser\(token\)/);
assert.match(bootstrap, /\.from\("profiles"\)/);
assert.match(bootstrap, /profile\?\.role !== "admin"/);
assert.match(bootstrap, /auth\.admin\.updateUserById/);
assert.match(bootstrap, /iqra_role: "admin"/);
assert.doesNotMatch(guard, /SERVICE_ROLE|SUPABASE_SERVICE_ROLE_KEY/i);

console.log('IQRA CMS integration trust-boundary checks passed.');
