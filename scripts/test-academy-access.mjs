import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const app = read('src/App.jsx');
const guard = read('src/admin/components/AdminOnlyGuard.jsx');
const sidebar = read('src/admin/components/AdminSidebar.jsx');
const courses = read('src/admin/pages/AcademyCourses.jsx');
const curriculum = read('src/admin/pages/AcademyCurriculum.jsx');
const schema = read('supabase/migrations/20261110090000_academy_core_schema.sql');
const integrity = read('supabase/migrations/20261110091000_academy_attempt_integrity.sql');
const adminHelper = read('supabase/migrations/015_rls_security_hardening.sql');

const academyRoutes = [
  'academy',
  'academy/courses',
  'academy/enrollments',
  'academy/courses/:id',
];

for (const route of academyRoutes) {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(
    app,
    new RegExp(`<Route path="${escaped}" element={<AdminOnlyGuard><Academy`)
  );
}

assert.match(guard, /const \{ isAdmin, loading \} = useAuth\(\)/);
assert.match(guard, /if \(!isAdmin\) return <Navigate to="\/admin" replace \/>/);
assert.match(sidebar, /section\.id === 'ACADEMY' && !isAdmin/);
assert.match(courses, /status: 'draft'/);
assert.match(curriculum, /status: 'draft'/);

const academyTables = [
  'academy_courses',
  'academy_modules',
  'academy_lessons',
  'academy_enrollments',
  'academy_lesson_progress',
  'academy_assessments',
  'academy_questions',
  'academy_question_answer_keys',
  'academy_attempts',
  'academy_attempt_answers',
  'academy_attempt_results',
];

for (const table of academyTables) {
  assert.match(schema, new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`));
}

assert.match(schema, /REVOKE ALL ON SCHEMA academy_private FROM PUBLIC, anon, authenticated/);
assert.match(schema, /CREATE POLICY academy_answer_keys_admin_all[\s\S]*?USING \(public\.is_admin\(\)\)[\s\S]*?WITH CHECK \(public\.is_admin\(\)\)/);
assert.doesNotMatch(schema, /CREATE POLICY academy_answer_keys_.*enrolled/i);
assert.match(adminHelper, /SECURITY DEFINER SET search_path = ''/);
assert.match(integrity, /pg_advisory_xact_lock/);
assert.match(integrity, /Maximum number of attempts reached/);
assert.match(integrity, /NEW\.student_id IS DISTINCT FROM \(SELECT auth\.uid\(\)\)/);

console.log('Academy access-boundary checks passed.');
