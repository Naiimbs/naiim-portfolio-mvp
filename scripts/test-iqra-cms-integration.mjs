import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const app = read('src/App.jsx');
const auth = read('src/admin/context/AuthContext.jsx');
const guard = read('src/admin/components/IqraAdminGuard.jsx');
const courses = read('src/admin/pages/AcademyCourses.jsx');
const curriculum = read('src/admin/pages/AcademyCurriculum.jsx');
const enrollments = read('src/admin/pages/AcademyEnrollments.jsx');
const progress = read('src/admin/pages/AcademyProgress.jsx');
const assessments = read('src/admin/pages/AcademyAssessments.jsx');
const sidebar = read('src/admin/components/AdminSidebar.jsx');
const bootstrap = read('supabase/functions/iqra-admin-bootstrap/index.ts');
const revoke = read('supabase/functions/iqra-admin-revoke/index.ts');
const lifecycleTests = read('supabase/functions/iqra-admin-lifecycle/index_test.ts');
const supabaseConfig = read('supabase/config.toml');

for (const route of ['academy', 'academy/courses', 'academy/enrollments', 'academy/progress', 'academy/assessments', 'academy/courses/:id']) {
  assert.ok(app.includes(`path="${route}" element={<IqraAdminGuard>`), `Missing IQRA guard on ${route}`);
}

assert.match(auth, /user\?\.app_metadata\?\.iqra_role === 'admin'/);
assert.match(guard, /if \(!isAdmin\) return <Navigate to="\/admin" replace \/>/);
assert.match(guard, /supabase\.functions\.invoke\('iqra-admin-bootstrap'/);
assert.match(guard, /supabase\.auth\.refreshSession\(\)/);
assert.match(curriculum, /const toggleLessonStatus = async \(lesson\) =>/);
assert.match(curriculum, /\.update\(\{ status: nextStatus \}\)/);
assert.match(curriculum, /lesson\.status === 'published' \? 'Move to draft'/);
assert.match(curriculum, /'Publish'/);


for (const [name, source] of [['courses', courses], ['curriculum', curriculum], ['enrollments', enrollments], ['progress', progress], ['assessments', assessments]]) {
  assert.doesNotMatch(source, /\.from\('academy_/);
  assert.match(source, /\.from\('iqra_/);
}

assert.match(bootstrap, /authClient\.auth\.getUser\(token\)/);
assert.match(bootstrap, /\.from\("profiles"\)/);
assert.match(bootstrap, /profile\?\.role !== "admin"/);
assert.match(bootstrap, /auth\.admin\.updateUserById/);
assert.match(bootstrap, /iqra_role: "admin"/);
assert.match(bootstrap, /from\("iqra_admin_grants"\)/);
assert.match(bootstrap, /\.upsert\(/);
assert.match(bootstrap, /\.delete\(\)/);

assert.match(revoke, /authClient\.auth\.getUser\(token\)/);
assert.match(revoke, /callerProfile\?\.role !== "admin"/);
assert.match(revoke, /target_user_id/);
assert.match(revoke, /from\("iqra_admin_grants"\)/);
assert.match(revoke, /iqra_role:\s*null/);
assert.match(revoke, /iqra_access_revoked: true/);


assert.match(sidebar, /Learning Progress/);
assert.match(sidebar, /Assessments/);
assert.match(progress, /iqra_lesson_progress/);
assert.match(progress, /progress_percent/);
assert.match(assessments, /iqra_assessments/);
assert.match(assessments, /iqra_questions/);
assert.match(assessments, /iqra_question_answer_keys/);
assert.match(assessments, /iqra_attempt_results/);
assert.match(assessments, /claimedAttempt/);
assert.match(assessments, /manual_review/);
assert.match(assessments, /Manual grading queue/);
assert.match(lifecycleTests, /bootstrap rejects anonymous callers/);
assert.match(lifecycleTests, /bootstrap rejects CMS editors/);
assert.match(lifecycleTests, /revoke rejects non-admin callers/);
assert.match(lifecycleTests, /revoke removes the database grant before clearing only the IQRA claim/);
assert.ok(bootstrap.includes("npm:@supabase/supabase-js@2.109.0"));
assert.ok(revoke.includes("npm:@supabase/supabase-js@2.109.0"));
for (const fn of ["iqra-admin-bootstrap", "iqra-admin-revoke"]) {
  const block = supabaseConfig.split(`[functions.${fn}]`)[1]?.split("\n[")[0] || "";
  assert.doesNotMatch(block, /verify_jwt\s*=\s*false/);
}

console.log('IQRA CMS integration trust-boundary checks passed.');
