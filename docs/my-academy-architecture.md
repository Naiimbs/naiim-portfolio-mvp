# My Academy — Architecture & MVP Delivery Plan

**Repository:** `Naiimbs/naiim-portfolio-mvp`  
**Starting branch:** `migration/react-phase-1`  
**Feature branch:** `feature/my-academy-mvp`  
**Database:** existing Supabase project `mywebsite` (eu-west-1)

## Product boundary

My Academy is a dedicated LMS domain inside the existing React application and Supabase project. It is not a CMS page template and must not store course delivery state in `pages`, `page_sections`, or `content_registry`.

- **Admin CMS:** marketing pages, blog, projects, media, SEO.
- **My Academy:** courses, modules, lessons, students, enrollments, assessments and progress.
- **Student Portal:** learner-facing experience, separated from the admin authoring UI.
- **AI services (later phases):** document processing, AI Course Builder, retrieval and AI Tutor. These are integrations around the LMS, not LMS table concerns.

## MVP scope (Phase 1)

- One instructor/admin.
- Course lifecycle: draft, published, archived.
- Course → modules → lessons.
- Student authentication and enrollment.
- Persistent lesson progress.
- Assessments: quizzes, questions, attempts and results.
- No marketplace, multi-instructor, multi-tenant, subscriptions or payments.
- No AI generation or vector/RAG tables in the MVP.

## Proposed data model

Create a dedicated `academy_` namespace in the public schema. Final DDL is deliberately deferred until the live database and migration history are reconciled.

| Table | Responsibility |
|---|---|
| `academy_courses` | Course metadata, slug, lifecycle, publication |
| `academy_modules` | Ordered modules belonging to a course |
| `academy_lessons` | Ordered lessons; versioned JSONB lesson body |
| `academy_enrollments` | Student ↔ course enrollment |
| `academy_lesson_progress` | Per-student lesson state and completion |
| `academy_assessments` | Quiz configuration attached to course/module/lesson |
| `academy_questions` | Question prompt, options and protected answer key |
| `academy_attempts` | Attempt lifecycle, score and submission timestamps |
| `academy_attempt_answers` | Optional per-question submitted answers and grading details |

Use UUID primary keys, explicit foreign keys, uniqueness constraints for ordering/slug/enrollment, and indexes on foreign-key and learner lookup columns. Store lesson content as validated, versioned JSONB initially; keep binary files in a dedicated private Storage bucket and reference storage paths rather than public URLs.

## Security model

- Admin-only authoring and publishing.
- Students may read published courses and lessons only when public or enrolled, according to the final course visibility rule.
- Students may read/write only their own enrollment, progress and attempts.
- Correct answers must not be exposed through client-readable question rows. Evaluate answers through a trusted server-side function or split answer keys into a separately protected table.
- Do not add `student` to the existing `user_role` enum until the current Auth/profile assumptions and admin guard are reviewed. Student authorization should be based on authenticated identity plus Academy enrollment, not CMS editor roles.
- RLS is required on every Academy table. Test policies as anon, authenticated student A, student B and admin.

## AI extension points (Phase 2+)

### Knowledge Processing
- Ingestion job records and source metadata.
- MinerU adapter for PDF parsing/OCR/layout extraction.
- Persist original file, extraction artifact, page references and processing status.
- Do not couple MinerU internals to the LMS lesson schema.

### AI Course Builder
- Generate editable course/module/lesson/quiz drafts from approved sources.
- Preserve provenance to source document and page.
- Require instructor review before saving as course content and explicit publish action.

### RAG & AI Tutor
- Chunk and embed approved knowledge sources.
- Scope retrieval by course and learner enrollment.
- Return source-grounded answers with citations.
- Keep vector schema and provider-specific details out of Phase 1.

## Existing code and migration caution

The current `/admin/courses` screen creates CMS pages using the learning-experience template. It is a legacy CMS authoring path and is not the new LMS. Keep it separate while My Academy is implemented.

The legacy `from-idea-to-mvp` learning page is excluded from this architecture and must remain untouched until a separate keep/archive/remove decision.

At the start of this implementation, repository migration files numbered 001–025 exist, while the live Supabase migration history reports only:
- `20261110072535_security_hardening_phase_1`
- `20261110072557_function_search_path_hardening`

The live database has 23 public tables and no Academy/LMS tables. This discrepancy is a release blocker for DDL, not proof of a specific schema failure. Do not replay the repository migrations or create Academy tables until the live schema, policies, and migration ledger are reconciled.

## Delivery sequence

1. Admin feature boundary and navigation.
2. Schema/migration reconciliation and reviewed Academy migration.
3. Admin course/module/lesson CRUD.
4. Student auth/enrollment and Student Portal.
5. Progress persistence.
6. Assessment authoring, attempts and secure grading.
7. End-to-end RLS and regression tests.
8. Phase 2: MinerU document ingestion.
9. Phase 3: AI Course Builder.
10. Phase 4: RAG and AI Tutor.

## Current implementation status

The first code slice adds the separate Admin Academy entry point and this architecture record. It does not yet create tables, alter authentication, deploy, or change existing CMS learning content.

## Database reconciliation and resilient schema

The live database audit is documented in [Database Reconciliation](./database-reconciliation.md). The LMS data model and security contract are documented in [My Academy Database Design](./my-academy-database-design.md).

The live project currently has 23 public tables with RLS enabled and no Academy tables. Repository migrations 001–025 structurally correspond to the existing CMS tables and later schema extensions, but the remote migration ledger contains only two later security-hardening entries. This is migration-history drift; it is not a reason to replay the old SQL. Reconcile the full remote schema and migration effects, then repair the migration ledger with the supported Supabase CLI before introducing new DDL.

Academy must use dedicated tables, explicit client grants, per-role RLS policies, ownership/enrollment indexes, private answer keys, and pgTAP allow/deny tests. Do not alter existing CMS enums or policies to implement student access. No Academy SQL has been applied yet.
