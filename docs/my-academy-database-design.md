# My Academy — Database Design (MVP)

**Status:** design baseline; not yet applied to Supabase  
**Scope:** single instructor/admin, authenticated learners, one existing Supabase project

## Design goals

1. Isolate learning data from the website CMS.
2. Make learner ownership enforceable in PostgreSQL, not just React.
3. Keep correct answers and grading data inaccessible to students.
4. Preserve referential integrity and useful history.
5. Index every foreign key and every column used by RLS.
6. Keep MinerU, AI Course Builder, embeddings and RAG outside the MVP schema.

## Proposed tables

| Table | Purpose | Main integrity rules |
|---|---|---|
| `academy_courses` | Course identity, slug, title, description, status and publication metadata | Unique normalized slug; status check; creator FK |
| `academy_modules` | Ordered course sections | Course FK; positive position; unique course + position |
| `academy_lessons` | Ordered lesson content | Module FK; versioned JSONB body; positive position; unique module + position |
| `academy_enrollments` | Learner access to a course | Course and Auth user FKs; unique course + student; checked lifecycle status |
| `academy_lesson_progress` | Per-learner lesson state | Unique lesson + student; completion state and timestamp consistency |
| `academy_assessments` | Lesson quizzes and assessment settings | Lesson FK; bounded pass score/attempt limit |
| `academy_questions` | Student-visible question prompt and options | Assessment FK; type check; positive position |
| `academy_question_answer_keys` | Correct answers and private grading rubric | One-to-one question FK; never readable by students |
| `academy_attempts` | Learner attempt lifecycle | Assessment + Auth user FKs; unique attempt number per learner |
| `academy_attempt_answers` | Learner-submitted answers only | Attempt + question FKs; unique answer per question per attempt |
| `academy_attempt_results` | Grading output and score | One result per attempt; written by trusted grading path |

This intentionally separates answer keys and grading results from student-readable question/answer rows. A student must never be able to select the correct answer by querying the Data API.

## Content representation

- Store lesson body as JSONB with an explicit `schema_version` and typed blocks.
- Validate block types and payload shape in the application/service layer before save.
- Keep large files in a dedicated private Academy Storage bucket; store storage paths and metadata, not public URLs.
- Keep a stable lesson ID and content version so future AI-generated drafts can refer to a source lesson without overwriting learner progress.
- Avoid an open-ended generic content-block table in v1 unless the authoring UI proves it necessary.

## Access model

### Admin
- The existing authenticated profile with `profiles.role = 'admin'` manages all Academy content, enrollments, assessment definitions and results.
- Do not add a new `student` value to the existing CMS `user_role` enum. A learner is an authenticated `auth.users` identity with an Academy enrollment, not a CMS editor role.

### Learner
- Learners can read published course catalog metadata.
- Learners can read lesson content only when enrolled in that course with an active or completed enrollment.
- Learners can read only their own enrollment, progress, attempts, submitted answers and results.
- Learners can update only their own progress and submit answers for their own in-progress attempts.
- Enrollment creation is admin-managed in the first iteration. Do not expose self-enrollment until open enrollment rules are explicitly decided.

### Database enforcement
- Enable RLS on every Academy table.
- Revoke default client grants, then grant only required table/column operations to `anon` and `authenticated`.
- Use explicit `TO anon` / `TO authenticated` policy roles.
- Use `(select auth.uid())` in policy predicates and index the ownership/filter columns.
- Use a non-exposed `private` schema for narrowly scoped SECURITY DEFINER helpers where cross-table enrollment checks are required. Pin `search_path = ''`, schema-qualify every reference, require a non-null `auth.uid()`, revoke EXECUTE from PUBLIC/anon, and grant only to authenticated.
- Avoid policy recursion and broad `FOR ALL TO public` policies.
- Add pgTAP tests for anon, learner A, learner B and admin; test both allowed and denied operations.

## Assessment security

- `academy_questions` contains only prompt, options and safe display metadata.
- `academy_question_answer_keys` is admin-only.
- Students insert/update only their answer payload while the attempt is in progress; they cannot write score, correctness, grade or feedback fields.
- A trusted Edge Function or narrowly scoped server-side grading function validates attempt ownership and attempt state, reads the answer key, calculates the result and writes `academy_attempt_results`.
- Students can read only their own result.
- Enforce maximum attempts and idempotent submission so retries cannot create duplicate grades.

## Reliability and performance

- UUID primary keys and explicit FK constraints.
- Add an index to every FK, including non-leading columns of composite keys.
- Add indexes for `student_id`, `course_id`, status and ordering columns where query/policy paths require them.
- Use unique constraints for slugs, ordering within a parent, enrollment identity, attempt number and answer identity.
- Use `ON DELETE RESTRICT` for records with learning history; archive courses rather than cascading away learner progress and results.
- Use consistent UTC `timestamptz` fields and server-side timestamps for enrollment, submission and grading.
- Use short transactions for course publishing and grading; make grading idempotent.
- Keep migrations additive and reversible where practical. Do not alter existing CMS enums or policies to accommodate Academy.

## Phase boundaries

### MVP
Courses, modules, lessons, enrollments, progress, quizzes, attempts and results.

### Phase 2 — Knowledge Processing
Add a separate ingestion domain for uploaded sources, extraction jobs, MinerU artifacts, page-level provenance and processing status. Keep original files and extraction output separate from lesson content.

### Phase 3 — AI Course Builder
Generate editable drafts from approved sources. Every generated lesson/question stores source references. Instructor review and explicit publish action are mandatory.

### Phase 4 — RAG and AI Tutor
Add chunking, embeddings and retrieval tables only when the source lifecycle and access rules are working. Retrieval must be scoped by course and enrollment, and answers must carry source citations.

Do not install pgvector or create embedding tables in the MVP migration.
