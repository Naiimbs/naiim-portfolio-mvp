-- My Academy core schema (MVP)
-- Validated by the clean local Supabase migration replay workflow.
-- Additive only: does not alter existing CMS tables, enums, policies or functions.
-- Apply only after the remote migration-history baseline has been reconciled.
-- CI must replay the full migration history on a clean local Supabase database.
SET lock_timeout = '5s';

CREATE SCHEMA IF NOT EXISTS academy_private;
REVOKE ALL ON SCHEMA academy_private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION academy_private.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$function$;

-- Course catalogue and authoring hierarchy.
CREATE TABLE public.academy_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  summary text,
  description text,
  cover_path text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_courses_slug_format CHECK (
    slug = lower(slug)
    AND slug !~ '[^a-z0-9-]'
    AND left(slug, 1) <> '-'
    AND right(slug, 1) <> '-'
    AND position('--' in slug) = 0
  ),
  CONSTRAINT academy_courses_title_not_blank CHECK (length(btrim(title)) > 0)
);

CREATE UNIQUE INDEX academy_courses_slug_lower_uidx
  ON public.academy_courses (lower(slug));
CREATE INDEX academy_courses_status_created_idx
  ON public.academy_courses (status, created_at DESC);
CREATE INDEX academy_courses_created_by_idx
  ON public.academy_courses (created_by);

CREATE TABLE public.academy_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  position integer NOT NULL CHECK (position > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_modules_course_position_key UNIQUE (course_id, position),
  CONSTRAINT academy_modules_title_not_blank CHECK (length(btrim(title)) > 0)
);

CREATE TABLE public.academy_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.academy_modules(id) ON DELETE RESTRICT,
  title text NOT NULL,
  summary text,
  position integer NOT NULL CHECK (position > 0),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  content jsonb NOT NULL DEFAULT '{"schema_version":1,"blocks":[]}'::jsonb,
  duration_minutes integer CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_lessons_module_position_key UNIQUE (module_id, position),
  CONSTRAINT academy_lessons_title_not_blank CHECK (length(btrim(title)) > 0),
  CONSTRAINT academy_lessons_content_object CHECK (jsonb_typeof(content) = 'object'),
  CONSTRAINT academy_lessons_content_schema_version CHECK (
    content ? 'schema_version'
    AND jsonb_typeof(content->'schema_version') = 'number'
    AND (content->>'schema_version')::numeric >= 1
    AND trunc((content->>'schema_version')::numeric) = (content->>'schema_version')::numeric
  )
);

-- Enrollment is the source of student access; no CMS role or self-enrollment.
CREATE TABLE public.academy_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE RESTRICT,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'revoked')),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_enrollments_course_student_key UNIQUE (course_id, student_id),
  CONSTRAINT academy_enrollments_completion_consistency CHECK (
    (status = 'completed' AND completed_at IS NOT NULL)
    OR (status <> 'completed' AND completed_at IS NULL)
  )
);
CREATE INDEX academy_enrollments_student_status_idx
  ON public.academy_enrollments (student_id, status);
-- The unique constraint already indexes course_id as its leading column.

CREATE TABLE public.academy_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.academy_lessons(id) ON DELETE RESTRICT,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed')),
  progress_percent numeric(5,2) NOT NULL DEFAULT 0
    CHECK (progress_percent >= 0 AND progress_percent <= 100),
  last_position_seconds integer NOT NULL DEFAULT 0 CHECK (last_position_seconds >= 0),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_lesson_progress_student_lesson_key UNIQUE (student_id, lesson_id),
  CONSTRAINT academy_lesson_progress_completion_consistency CHECK (
    (status = 'completed' AND completed_at IS NOT NULL AND progress_percent = 100)
    OR (status = 'in_progress' AND completed_at IS NULL)
  )
);
CREATE INDEX academy_lesson_progress_lesson_idx
  ON public.academy_lesson_progress (lesson_id);

-- Assessments. Correct answers are deliberately stored separately.
CREATE TABLE public.academy_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.academy_lessons(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  pass_score numeric(5,2) NOT NULL DEFAULT 70
    CHECK (pass_score >= 0 AND pass_score <= 100),
  max_attempts integer CHECK (max_attempts IS NULL OR max_attempts > 0),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_assessments_title_not_blank CHECK (length(btrim(title)) > 0)
);
CREATE INDEX academy_assessments_lesson_idx
  ON public.academy_assessments (lesson_id);

CREATE TABLE public.academy_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.academy_assessments(id) ON DELETE RESTRICT,
  question_type text NOT NULL
    CHECK (question_type IN ('single_choice', 'multiple_choice', 'short_text', 'long_text')),
  prompt text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  points numeric(8,2) NOT NULL DEFAULT 1 CHECK (points > 0),
  position integer NOT NULL CHECK (position > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_questions_assessment_position_key UNIQUE (assessment_id, position),
  CONSTRAINT academy_questions_options_array CHECK (jsonb_typeof(options) = 'array'),
  CONSTRAINT academy_questions_prompt_not_blank CHECK (length(btrim(prompt)) > 0)
);

CREATE TABLE public.academy_question_answer_keys (
  question_id uuid PRIMARY KEY REFERENCES public.academy_questions(id) ON DELETE RESTRICT,
  correct_answer jsonb NOT NULL,
  explanation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.academy_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.academy_assessments(id) ON DELETE RESTRICT,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL CHECK (attempt_number > 0),
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'submitted', 'graded')),
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_attempts_assessment_student_number_key
    UNIQUE (assessment_id, student_id, attempt_number),
  CONSTRAINT academy_attempts_submission_consistency CHECK (
    (status = 'in_progress' AND submitted_at IS NULL)
    OR (status IN ('submitted', 'graded') AND submitted_at IS NOT NULL)
  )
);
CREATE INDEX academy_attempts_student_idx
  ON public.academy_attempts (student_id, started_at DESC);

CREATE TABLE public.academy_attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.academy_attempts(id) ON DELETE RESTRICT,
  question_id uuid NOT NULL REFERENCES public.academy_questions(id) ON DELETE RESTRICT,
  answer jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_attempt_answers_attempt_question_key UNIQUE (attempt_id, question_id)
);
CREATE INDEX academy_attempt_answers_question_idx
  ON public.academy_attempt_answers (question_id);

-- Results are written only by the trusted grading path or an admin.
CREATE TABLE public.academy_attempt_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL UNIQUE REFERENCES public.academy_attempts(id) ON DELETE RESTRICT,
  score_percent numeric(5,2) NOT NULL CHECK (score_percent >= 0 AND score_percent <= 100),
  passed boolean NOT NULL,
  feedback text,
  graded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  graded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX academy_attempt_results_graded_by_idx
  ON public.academy_attempt_results (graded_by);

-- Consistent updated_at behavior without exposing a callable public RPC.
CREATE TRIGGER academy_courses_set_updated_at
  BEFORE UPDATE ON public.academy_courses
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_modules_set_updated_at
  BEFORE UPDATE ON public.academy_modules
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_lessons_set_updated_at
  BEFORE UPDATE ON public.academy_lessons
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_enrollments_set_updated_at
  BEFORE UPDATE ON public.academy_enrollments
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_lesson_progress_set_updated_at
  BEFORE UPDATE ON public.academy_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_assessments_set_updated_at
  BEFORE UPDATE ON public.academy_assessments
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_questions_set_updated_at
  BEFORE UPDATE ON public.academy_questions
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_question_answer_keys_set_updated_at
  BEFORE UPDATE ON public.academy_question_answer_keys
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_attempts_set_updated_at
  BEFORE UPDATE ON public.academy_attempts
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_attempt_answers_set_updated_at
  BEFORE UPDATE ON public.academy_attempt_answers
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();

-- RLS is enabled on every exposed Academy table.
ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_question_answer_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_attempt_results ENABLE ROW LEVEL SECURITY;

-- Remove any default client privileges before granting the smallest required set.
REVOKE ALL ON TABLE
  public.academy_courses,
  public.academy_modules,
  public.academy_lessons,
  public.academy_enrollments,
  public.academy_lesson_progress,
  public.academy_assessments,
  public.academy_questions,
  public.academy_question_answer_keys,
  public.academy_attempts,
  public.academy_attempt_answers,
  public.academy_attempt_results
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.academy_courses TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.academy_courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.academy_modules,
  public.academy_lessons,
  public.academy_enrollments,
  public.academy_assessments,
  public.academy_questions,
  public.academy_question_answer_keys,
  public.academy_attempts,
  public.academy_attempt_answers
TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.academy_lesson_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_attempt_results TO authenticated;
GRANT ALL ON TABLE
  public.academy_courses,
  public.academy_modules,
  public.academy_lessons,
  public.academy_enrollments,
  public.academy_lesson_progress,
  public.academy_assessments,
  public.academy_questions,
  public.academy_question_answer_keys,
  public.academy_attempts,
  public.academy_attempt_answers,
  public.academy_attempt_results
TO service_role;

-- Catalogue: only published courses are visible to the public.
CREATE POLICY academy_courses_catalog_read
  ON public.academy_courses FOR SELECT TO anon, authenticated
  USING (status = 'published');
CREATE POLICY academy_courses_admin_all
  ON public.academy_courses FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Course structure is visible only to enrolled learners or the admin.
CREATE POLICY academy_modules_enrolled_read
  ON public.academy_modules FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_enrollments e
      JOIN public.academy_courses c ON c.id = e.course_id
      WHERE e.course_id = academy_modules.course_id
        AND e.student_id = (SELECT auth.uid())
        AND e.status IN ('active', 'completed')
        AND c.status IN ('published', 'archived')
    )
  );
CREATE POLICY academy_modules_admin_all
  ON public.academy_modules FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_lessons_enrolled_read
  ON public.academy_lessons FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (
      status = 'published'
      AND EXISTS (
        SELECT 1
        FROM public.academy_modules m
        JOIN public.academy_enrollments e ON e.course_id = m.course_id
        JOIN public.academy_courses c ON c.id = e.course_id
        WHERE m.id = academy_lessons.module_id
          AND e.student_id = (SELECT auth.uid())
          AND e.status IN ('active', 'completed')
          AND c.status IN ('published', 'archived')
      )
    )
  );
CREATE POLICY academy_lessons_admin_all
  ON public.academy_lessons FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_enrollments_own_read
  ON public.academy_enrollments FOR SELECT TO authenticated
  USING (student_id = (SELECT auth.uid()));
CREATE POLICY academy_enrollments_admin_all
  ON public.academy_enrollments FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_lesson_progress_own_read
  ON public.academy_lesson_progress FOR SELECT TO authenticated
  USING (student_id = (SELECT auth.uid()));
CREATE POLICY academy_lesson_progress_own_insert
  ON public.academy_lesson_progress FOR INSERT TO authenticated
  WITH CHECK (
    student_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.academy_lessons l
      JOIN public.academy_modules m ON m.id = l.module_id
      JOIN public.academy_enrollments e ON e.course_id = m.course_id
      WHERE l.id = academy_lesson_progress.lesson_id
        AND e.student_id = (SELECT auth.uid())
        AND e.status = 'active'
    )
  );
CREATE POLICY academy_lesson_progress_own_update
  ON public.academy_lesson_progress FOR UPDATE TO authenticated
  USING (student_id = (SELECT auth.uid()))
  WITH CHECK (
    student_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.academy_lessons l
      JOIN public.academy_modules m ON m.id = l.module_id
      JOIN public.academy_enrollments e ON e.course_id = m.course_id
      WHERE l.id = academy_lesson_progress.lesson_id
        AND e.student_id = (SELECT auth.uid())
        AND e.status = 'active'
    )
  );
CREATE POLICY academy_lesson_progress_admin_all
  ON public.academy_lesson_progress FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_assessments_enrolled_read
  ON public.academy_assessments FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (
      is_published
      AND EXISTS (
        SELECT 1
        FROM public.academy_lessons l
        JOIN public.academy_modules m ON m.id = l.module_id
        JOIN public.academy_enrollments e ON e.course_id = m.course_id
        WHERE l.id = academy_assessments.lesson_id
          AND e.student_id = (SELECT auth.uid())
          AND e.status = 'active'
      )
    )
  );
CREATE POLICY academy_assessments_admin_all
  ON public.academy_assessments FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_questions_enrolled_read
  ON public.academy_questions FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_assessments a
      JOIN public.academy_lessons l ON l.id = a.lesson_id
      JOIN public.academy_modules m ON m.id = l.module_id
      JOIN public.academy_enrollments e ON e.course_id = m.course_id
      WHERE a.id = academy_questions.assessment_id
        AND a.is_published
        AND e.student_id = (SELECT auth.uid())
        AND e.status = 'active'
    )
  );
CREATE POLICY academy_questions_admin_all
  ON public.academy_questions FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Answer keys are administrator-only; there is no student-facing SELECT policy.
CREATE POLICY academy_answer_keys_admin_all
  ON public.academy_question_answer_keys FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_attempts_own_read
  ON public.academy_attempts FOR SELECT TO authenticated
  USING (student_id = (SELECT auth.uid()));
CREATE POLICY academy_attempts_own_insert
  ON public.academy_attempts FOR INSERT TO authenticated
  WITH CHECK (
    student_id = (SELECT auth.uid())
    AND status = 'in_progress'
    AND EXISTS (
      SELECT 1
      FROM public.academy_assessments a
      JOIN public.academy_lessons l ON l.id = a.lesson_id
      JOIN public.academy_modules m ON m.id = l.module_id
      JOIN public.academy_enrollments e ON e.course_id = m.course_id
      WHERE a.id = academy_attempts.assessment_id
        AND a.is_published
        AND e.student_id = (SELECT auth.uid())
        AND e.status = 'active'
    )
  );
CREATE POLICY academy_attempts_own_update
  ON public.academy_attempts FOR UPDATE TO authenticated
  USING (student_id = (SELECT auth.uid()) AND status = 'in_progress')
  WITH CHECK (student_id = (SELECT auth.uid()) AND status IN ('in_progress', 'submitted'));
CREATE POLICY academy_attempts_admin_all
  ON public.academy_attempts FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_attempt_answers_own_read
  ON public.academy_attempt_answers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_attempts a
      WHERE a.id = academy_attempt_answers.attempt_id
        AND a.student_id = (SELECT auth.uid())
    )
  );
CREATE POLICY academy_attempt_answers_own_insert
  ON public.academy_attempt_answers FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.academy_attempts a
      WHERE a.id = academy_attempt_answers.attempt_id
        AND a.student_id = (SELECT auth.uid())
        AND a.status = 'in_progress'
    )
  );
CREATE POLICY academy_attempt_answers_own_update
  ON public.academy_attempt_answers FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_attempts a
      WHERE a.id = academy_attempt_answers.attempt_id
        AND a.student_id = (SELECT auth.uid())
        AND a.status = 'in_progress'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.academy_attempts a
      WHERE a.id = academy_attempt_answers.attempt_id
        AND a.student_id = (SELECT auth.uid())
        AND a.status = 'in_progress'
    )
  );
CREATE POLICY academy_attempt_answers_admin_all
  ON public.academy_attempt_answers FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_attempt_results_own_read
  ON public.academy_attempt_results FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_attempts a
      WHERE a.id = academy_attempt_results.attempt_id
        AND a.student_id = (SELECT auth.uid())
    )
  );
CREATE POLICY academy_attempt_results_admin_all
  ON public.academy_attempt_results FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- No client role can execute the private trigger function directly.
REVOKE ALL ON FUNCTION academy_private.set_updated_at() FROM PUBLIC, anon, authenticated;

COMMENT ON SCHEMA academy_private IS 'Private implementation helpers for My Academy; not exposed through the Supabase Data API.';
COMMENT ON TABLE public.academy_courses IS 'Standalone LMS course catalogue; independent from CMS pages.';
COMMENT ON TABLE public.academy_lessons IS 'Versioned structured lesson body. Keep large files in a private Storage bucket.';
COMMENT ON TABLE public.academy_question_answer_keys IS 'Private answer keys; never expose to learners.';
COMMENT ON TABLE public.academy_attempt_results IS 'Trusted grading output; row-level security restricts writes to admins and trusted server-side grading code.';
),
  CONSTRAINT academy_courses_title_not_blank CHECK (length(btrim(title)) > 0)
);

CREATE UNIQUE INDEX academy_courses_slug_lower_uidx
  ON public.academy_courses (lower(slug));
CREATE INDEX academy_courses_status_created_idx
  ON public.academy_courses (status, created_at DESC);
CREATE INDEX academy_courses_created_by_idx
  ON public.academy_courses (created_by);

CREATE TABLE public.academy_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  position integer NOT NULL CHECK (position > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_modules_course_position_key UNIQUE (course_id, position),
  CONSTRAINT academy_modules_title_not_blank CHECK (length(btrim(title)) > 0)
);

CREATE TABLE public.academy_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.academy_modules(id) ON DELETE RESTRICT,
  title text NOT NULL,
  summary text,
  position integer NOT NULL CHECK (position > 0),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  content jsonb NOT NULL DEFAULT '{"schema_version":1,"blocks":[]}'::jsonb,
  duration_minutes integer CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_lessons_module_position_key UNIQUE (module_id, position),
  CONSTRAINT academy_lessons_title_not_blank CHECK (length(btrim(title)) > 0),
  CONSTRAINT academy_lessons_content_object CHECK (jsonb_typeof(content) = 'object'),
  CONSTRAINT academy_lessons_content_schema_version CHECK (
    content ? 'schema_version'
    AND jsonb_typeof(content->'schema_version') = 'number'
    AND (content->>'schema_version')::integer >= 1
  )
);

-- Enrollment is the source of student access; no CMS role or self-enrollment.
CREATE TABLE public.academy_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE RESTRICT,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'revoked')),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_enrollments_course_student_key UNIQUE (course_id, student_id),
  CONSTRAINT academy_enrollments_completion_consistency CHECK (
    (status = 'completed' AND completed_at IS NOT NULL)
    OR (status <> 'completed' AND completed_at IS NULL)
  )
);
CREATE INDEX academy_enrollments_student_status_idx
  ON public.academy_enrollments (student_id, status);
-- The unique constraint already indexes course_id as its leading column.

CREATE TABLE public.academy_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.academy_lessons(id) ON DELETE RESTRICT,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed')),
  progress_percent numeric(5,2) NOT NULL DEFAULT 0
    CHECK (progress_percent >= 0 AND progress_percent <= 100),
  last_position_seconds integer NOT NULL DEFAULT 0 CHECK (last_position_seconds >= 0),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_lesson_progress_student_lesson_key UNIQUE (student_id, lesson_id),
  CONSTRAINT academy_lesson_progress_completion_consistency CHECK (
    (status = 'completed' AND completed_at IS NOT NULL AND progress_percent = 100)
    OR (status = 'in_progress' AND completed_at IS NULL)
  )
);
CREATE INDEX academy_lesson_progress_lesson_idx
  ON public.academy_lesson_progress (lesson_id);

-- Assessments. Correct answers are deliberately stored separately.
CREATE TABLE public.academy_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.academy_lessons(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  pass_score numeric(5,2) NOT NULL DEFAULT 70
    CHECK (pass_score >= 0 AND pass_score <= 100),
  max_attempts integer CHECK (max_attempts IS NULL OR max_attempts > 0),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_assessments_title_not_blank CHECK (length(btrim(title)) > 0)
);
CREATE INDEX academy_assessments_lesson_idx
  ON public.academy_assessments (lesson_id);

CREATE TABLE public.academy_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.academy_assessments(id) ON DELETE RESTRICT,
  question_type text NOT NULL
    CHECK (question_type IN ('single_choice', 'multiple_choice', 'short_text', 'long_text')),
  prompt text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  points numeric(8,2) NOT NULL DEFAULT 1 CHECK (points > 0),
  position integer NOT NULL CHECK (position > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_questions_assessment_position_key UNIQUE (assessment_id, position),
  CONSTRAINT academy_questions_options_array CHECK (jsonb_typeof(options) = 'array'),
  CONSTRAINT academy_questions_prompt_not_blank CHECK (length(btrim(prompt)) > 0)
);

CREATE TABLE public.academy_question_answer_keys (
  question_id uuid PRIMARY KEY REFERENCES public.academy_questions(id) ON DELETE RESTRICT,
  correct_answer jsonb NOT NULL,
  explanation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.academy_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.academy_assessments(id) ON DELETE RESTRICT,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL CHECK (attempt_number > 0),
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'submitted', 'graded')),
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_attempts_assessment_student_number_key
    UNIQUE (assessment_id, student_id, attempt_number),
  CONSTRAINT academy_attempts_submission_consistency CHECK (
    (status = 'in_progress' AND submitted_at IS NULL)
    OR (status IN ('submitted', 'graded') AND submitted_at IS NOT NULL)
  )
);
CREATE INDEX academy_attempts_student_idx
  ON public.academy_attempts (student_id, started_at DESC);

CREATE TABLE public.academy_attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.academy_attempts(id) ON DELETE RESTRICT,
  question_id uuid NOT NULL REFERENCES public.academy_questions(id) ON DELETE RESTRICT,
  answer jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_attempt_answers_attempt_question_key UNIQUE (attempt_id, question_id)
);
CREATE INDEX academy_attempt_answers_question_idx
  ON public.academy_attempt_answers (question_id);

-- Results are written only by the trusted grading path or an admin.
CREATE TABLE public.academy_attempt_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL UNIQUE REFERENCES public.academy_attempts(id) ON DELETE RESTRICT,
  score_percent numeric(5,2) NOT NULL CHECK (score_percent >= 0 AND score_percent <= 100),
  passed boolean NOT NULL,
  feedback text,
  graded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  graded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX academy_attempt_results_graded_by_idx
  ON public.academy_attempt_results (graded_by);

-- Consistent updated_at behavior without exposing a callable public RPC.
CREATE TRIGGER academy_courses_set_updated_at
  BEFORE UPDATE ON public.academy_courses
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_modules_set_updated_at
  BEFORE UPDATE ON public.academy_modules
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_lessons_set_updated_at
  BEFORE UPDATE ON public.academy_lessons
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_enrollments_set_updated_at
  BEFORE UPDATE ON public.academy_enrollments
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_lesson_progress_set_updated_at
  BEFORE UPDATE ON public.academy_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_assessments_set_updated_at
  BEFORE UPDATE ON public.academy_assessments
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_questions_set_updated_at
  BEFORE UPDATE ON public.academy_questions
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_question_answer_keys_set_updated_at
  BEFORE UPDATE ON public.academy_question_answer_keys
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_attempts_set_updated_at
  BEFORE UPDATE ON public.academy_attempts
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_attempt_answers_set_updated_at
  BEFORE UPDATE ON public.academy_attempt_answers
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();

-- RLS is enabled on every exposed Academy table.
ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_question_answer_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_attempt_results ENABLE ROW LEVEL SECURITY;

-- Remove any default client privileges before granting the smallest required set.
REVOKE ALL ON TABLE
  public.academy_courses,
  public.academy_modules,
  public.academy_lessons,
  public.academy_enrollments,
  public.academy_lesson_progress,
  public.academy_assessments,
  public.academy_questions,
  public.academy_question_answer_keys,
  public.academy_attempts,
  public.academy_attempt_answers,
  public.academy_attempt_results
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.academy_courses TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.academy_courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.academy_modules,
  public.academy_lessons,
  public.academy_enrollments,
  public.academy_assessments,
  public.academy_questions,
  public.academy_question_answer_keys,
  public.academy_attempts,
  public.academy_attempt_answers
TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.academy_lesson_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_attempt_results TO authenticated;
GRANT ALL ON TABLE
  public.academy_courses,
  public.academy_modules,
  public.academy_lessons,
  public.academy_enrollments,
  public.academy_lesson_progress,
  public.academy_assessments,
  public.academy_questions,
  public.academy_question_answer_keys,
  public.academy_attempts,
  public.academy_attempt_answers,
  public.academy_attempt_results
TO service_role;

-- Catalogue: only published courses are visible to the public.
CREATE POLICY academy_courses_catalog_read
  ON public.academy_courses FOR SELECT TO anon, authenticated
  USING (status = 'published');
CREATE POLICY academy_courses_admin_all
  ON public.academy_courses FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Course structure is visible only to enrolled learners or the admin.
CREATE POLICY academy_modules_enrolled_read
  ON public.academy_modules FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_enrollments e
      JOIN public.academy_courses c ON c.id = e.course_id
      WHERE e.course_id = academy_modules.course_id
        AND e.student_id = (SELECT auth.uid())
        AND e.status IN ('active', 'completed')
        AND c.status IN ('published', 'archived')
    )
  );
CREATE POLICY academy_modules_admin_all
  ON public.academy_modules FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_lessons_enrolled_read
  ON public.academy_lessons FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (
      status = 'published'
      AND EXISTS (
        SELECT 1
        FROM public.academy_modules m
        JOIN public.academy_enrollments e ON e.course_id = m.course_id
        JOIN public.academy_courses c ON c.id = e.course_id
        WHERE m.id = academy_lessons.module_id
          AND e.student_id = (SELECT auth.uid())
          AND e.status IN ('active', 'completed')
          AND c.status IN ('published', 'archived')
      )
    )
  );
CREATE POLICY academy_lessons_admin_all
  ON public.academy_lessons FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_enrollments_own_read
  ON public.academy_enrollments FOR SELECT TO authenticated
  USING (student_id = (SELECT auth.uid()));
CREATE POLICY academy_enrollments_admin_all
  ON public.academy_enrollments FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_lesson_progress_own_read
  ON public.academy_lesson_progress FOR SELECT TO authenticated
  USING (student_id = (SELECT auth.uid()));
CREATE POLICY academy_lesson_progress_own_insert
  ON public.academy_lesson_progress FOR INSERT TO authenticated
  WITH CHECK (
    student_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.academy_lessons l
      JOIN public.academy_modules m ON m.id = l.module_id
      JOIN public.academy_enrollments e ON e.course_id = m.course_id
      WHERE l.id = academy_lesson_progress.lesson_id
        AND e.student_id = (SELECT auth.uid())
        AND e.status = 'active'
    )
  );
CREATE POLICY academy_lesson_progress_own_update
  ON public.academy_lesson_progress FOR UPDATE TO authenticated
  USING (student_id = (SELECT auth.uid()))
  WITH CHECK (
    student_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.academy_lessons l
      JOIN public.academy_modules m ON m.id = l.module_id
      JOIN public.academy_enrollments e ON e.course_id = m.course_id
      WHERE l.id = academy_lesson_progress.lesson_id
        AND e.student_id = (SELECT auth.uid())
        AND e.status = 'active'
    )
  );
CREATE POLICY academy_lesson_progress_admin_all
  ON public.academy_lesson_progress FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_assessments_enrolled_read
  ON public.academy_assessments FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (
      is_published
      AND EXISTS (
        SELECT 1
        FROM public.academy_lessons l
        JOIN public.academy_modules m ON m.id = l.module_id
        JOIN public.academy_enrollments e ON e.course_id = m.course_id
        WHERE l.id = academy_assessments.lesson_id
          AND e.student_id = (SELECT auth.uid())
          AND e.status = 'active'
      )
    )
  );
CREATE POLICY academy_assessments_admin_all
  ON public.academy_assessments FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_questions_enrolled_read
  ON public.academy_questions FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_assessments a
      JOIN public.academy_lessons l ON l.id = a.lesson_id
      JOIN public.academy_modules m ON m.id = l.module_id
      JOIN public.academy_enrollments e ON e.course_id = m.course_id
      WHERE a.id = academy_questions.assessment_id
        AND a.is_published
        AND e.student_id = (SELECT auth.uid())
        AND e.status = 'active'
    )
  );
CREATE POLICY academy_questions_admin_all
  ON public.academy_questions FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Answer keys are administrator-only; there is no student-facing SELECT policy.
CREATE POLICY academy_answer_keys_admin_all
  ON public.academy_question_answer_keys FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_attempts_own_read
  ON public.academy_attempts FOR SELECT TO authenticated
  USING (student_id = (SELECT auth.uid()));
CREATE POLICY academy_attempts_own_insert
  ON public.academy_attempts FOR INSERT TO authenticated
  WITH CHECK (
    student_id = (SELECT auth.uid())
    AND status = 'in_progress'
    AND EXISTS (
      SELECT 1
      FROM public.academy_assessments a
      JOIN public.academy_lessons l ON l.id = a.lesson_id
      JOIN public.academy_modules m ON m.id = l.module_id
      JOIN public.academy_enrollments e ON e.course_id = m.course_id
      WHERE a.id = academy_attempts.assessment_id
        AND a.is_published
        AND e.student_id = (SELECT auth.uid())
        AND e.status = 'active'
    )
  );
CREATE POLICY academy_attempts_own_update
  ON public.academy_attempts FOR UPDATE TO authenticated
  USING (student_id = (SELECT auth.uid()) AND status = 'in_progress')
  WITH CHECK (student_id = (SELECT auth.uid()) AND status IN ('in_progress', 'submitted'));
CREATE POLICY academy_attempts_admin_all
  ON public.academy_attempts FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_attempt_answers_own_read
  ON public.academy_attempt_answers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_attempts a
      WHERE a.id = academy_attempt_answers.attempt_id
        AND a.student_id = (SELECT auth.uid())
    )
  );
CREATE POLICY academy_attempt_answers_own_insert
  ON public.academy_attempt_answers FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.academy_attempts a
      WHERE a.id = academy_attempt_answers.attempt_id
        AND a.student_id = (SELECT auth.uid())
        AND a.status = 'in_progress'
    )
  );
CREATE POLICY academy_attempt_answers_own_update
  ON public.academy_attempt_answers FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_attempts a
      WHERE a.id = academy_attempt_answers.attempt_id
        AND a.student_id = (SELECT auth.uid())
        AND a.status = 'in_progress'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.academy_attempts a
      WHERE a.id = academy_attempt_answers.attempt_id
        AND a.student_id = (SELECT auth.uid())
        AND a.status = 'in_progress'
    )
  );
CREATE POLICY academy_attempt_answers_admin_all
  ON public.academy_attempt_answers FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_attempt_results_own_read
  ON public.academy_attempt_results FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_attempts a
      WHERE a.id = academy_attempt_results.attempt_id
        AND a.student_id = (SELECT auth.uid())
    )
  );
CREATE POLICY academy_attempt_results_admin_all
  ON public.academy_attempt_results FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- No client role can execute the private trigger function directly.
REVOKE ALL ON FUNCTION academy_private.set_updated_at() FROM PUBLIC, anon, authenticated;

COMMENT ON SCHEMA academy_private IS 'Private implementation helpers for My Academy; not exposed through the Supabase Data API.';
COMMENT ON TABLE public.academy_courses IS 'Standalone LMS course catalogue; independent from CMS pages.';
COMMENT ON TABLE public.academy_lessons IS 'Versioned structured lesson body. Keep large files in a private Storage bucket.';
COMMENT ON TABLE public.academy_question_answer_keys IS 'Private answer keys; never expose to learners.';
COMMENT ON TABLE public.academy_attempt_results IS 'Trusted grading output; clients cannot insert or update results.';

  )
);

-- Enrollment is the source of student access; no CMS role or self-enrollment.
CREATE TABLE public.academy_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE RESTRICT,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'revoked')),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_enrollments_course_student_key UNIQUE (course_id, student_id),
  CONSTRAINT academy_enrollments_completion_consistency CHECK (
    (status = 'completed' AND completed_at IS NOT NULL)
    OR (status <> 'completed' AND completed_at IS NULL)
  )
);
CREATE INDEX academy_enrollments_student_status_idx
  ON public.academy_enrollments (student_id, status);
-- The unique constraint already indexes course_id as its leading column.

CREATE TABLE public.academy_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.academy_lessons(id) ON DELETE RESTRICT,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed')),
  progress_percent numeric(5,2) NOT NULL DEFAULT 0
    CHECK (progress_percent >= 0 AND progress_percent <= 100),
  last_position_seconds integer NOT NULL DEFAULT 0 CHECK (last_position_seconds >= 0),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_lesson_progress_student_lesson_key UNIQUE (student_id, lesson_id),
  CONSTRAINT academy_lesson_progress_completion_consistency CHECK (
    (status = 'completed' AND completed_at IS NOT NULL AND progress_percent = 100)
    OR (status = 'in_progress' AND completed_at IS NULL)
  )
);
CREATE INDEX academy_lesson_progress_lesson_idx
  ON public.academy_lesson_progress (lesson_id);

-- Assessments. Correct answers are deliberately stored separately.
CREATE TABLE public.academy_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.academy_lessons(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  pass_score numeric(5,2) NOT NULL DEFAULT 70
    CHECK (pass_score >= 0 AND pass_score <= 100),
  max_attempts integer CHECK (max_attempts IS NULL OR max_attempts > 0),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_assessments_title_not_blank CHECK (length(btrim(title)) > 0)
);
CREATE INDEX academy_assessments_lesson_idx
  ON public.academy_assessments (lesson_id);

CREATE TABLE public.academy_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.academy_assessments(id) ON DELETE RESTRICT,
  question_type text NOT NULL
    CHECK (question_type IN ('single_choice', 'multiple_choice', 'short_text', 'long_text')),
  prompt text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  points numeric(8,2) NOT NULL DEFAULT 1 CHECK (points > 0),
  position integer NOT NULL CHECK (position > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_questions_assessment_position_key UNIQUE (assessment_id, position),
  CONSTRAINT academy_questions_options_array CHECK (jsonb_typeof(options) = 'array'),
  CONSTRAINT academy_questions_prompt_not_blank CHECK (length(btrim(prompt)) > 0)
);

CREATE TABLE public.academy_question_answer_keys (
  question_id uuid PRIMARY KEY REFERENCES public.academy_questions(id) ON DELETE RESTRICT,
  correct_answer jsonb NOT NULL,
  explanation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.academy_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.academy_assessments(id) ON DELETE RESTRICT,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL CHECK (attempt_number > 0),
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'submitted', 'graded')),
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_attempts_assessment_student_number_key
    UNIQUE (assessment_id, student_id, attempt_number),
  CONSTRAINT academy_attempts_submission_consistency CHECK (
    (status = 'in_progress' AND submitted_at IS NULL)
    OR (status IN ('submitted', 'graded') AND submitted_at IS NOT NULL)
  )
);
CREATE INDEX academy_attempts_student_idx
  ON public.academy_attempts (student_id, started_at DESC);

CREATE TABLE public.academy_attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.academy_attempts(id) ON DELETE RESTRICT,
  question_id uuid NOT NULL REFERENCES public.academy_questions(id) ON DELETE RESTRICT,
  answer jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_attempt_answers_attempt_question_key UNIQUE (attempt_id, question_id)
);
CREATE INDEX academy_attempt_answers_question_idx
  ON public.academy_attempt_answers (question_id);

-- Results are written only by the trusted grading path or an admin.
CREATE TABLE public.academy_attempt_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL UNIQUE REFERENCES public.academy_attempts(id) ON DELETE RESTRICT,
  score_percent numeric(5,2) NOT NULL CHECK (score_percent >= 0 AND score_percent <= 100),
  passed boolean NOT NULL,
  feedback text,
  graded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  graded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX academy_attempt_results_graded_by_idx
  ON public.academy_attempt_results (graded_by);

-- Consistent updated_at behavior without exposing a callable public RPC.
CREATE TRIGGER academy_courses_set_updated_at
  BEFORE UPDATE ON public.academy_courses
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_modules_set_updated_at
  BEFORE UPDATE ON public.academy_modules
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_lessons_set_updated_at
  BEFORE UPDATE ON public.academy_lessons
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_enrollments_set_updated_at
  BEFORE UPDATE ON public.academy_enrollments
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_lesson_progress_set_updated_at
  BEFORE UPDATE ON public.academy_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_assessments_set_updated_at
  BEFORE UPDATE ON public.academy_assessments
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_questions_set_updated_at
  BEFORE UPDATE ON public.academy_questions
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_question_answer_keys_set_updated_at
  BEFORE UPDATE ON public.academy_question_answer_keys
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_attempts_set_updated_at
  BEFORE UPDATE ON public.academy_attempts
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_attempt_answers_set_updated_at
  BEFORE UPDATE ON public.academy_attempt_answers
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();

-- RLS is enabled on every exposed Academy table.
ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_question_answer_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_attempt_results ENABLE ROW LEVEL SECURITY;

-- Remove any default client privileges before granting the smallest required set.
REVOKE ALL ON TABLE
  public.academy_courses,
  public.academy_modules,
  public.academy_lessons,
  public.academy_enrollments,
  public.academy_lesson_progress,
  public.academy_assessments,
  public.academy_questions,
  public.academy_question_answer_keys,
  public.academy_attempts,
  public.academy_attempt_answers,
  public.academy_attempt_results
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.academy_courses TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.academy_courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.academy_modules,
  public.academy_lessons,
  public.academy_enrollments,
  public.academy_assessments,
  public.academy_questions,
  public.academy_question_answer_keys,
  public.academy_attempts,
  public.academy_attempt_answers
TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.academy_lesson_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_attempt_results TO authenticated;
GRANT ALL ON TABLE
  public.academy_courses,
  public.academy_modules,
  public.academy_lessons,
  public.academy_enrollments,
  public.academy_lesson_progress,
  public.academy_assessments,
  public.academy_questions,
  public.academy_question_answer_keys,
  public.academy_attempts,
  public.academy_attempt_answers,
  public.academy_attempt_results
TO service_role;

-- Catalogue: only published courses are visible to the public.
CREATE POLICY academy_courses_catalog_read
  ON public.academy_courses FOR SELECT TO anon, authenticated
  USING (status = 'published');
CREATE POLICY academy_courses_admin_all
  ON public.academy_courses FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Course structure is visible only to enrolled learners or the admin.
CREATE POLICY academy_modules_enrolled_read
  ON public.academy_modules FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_enrollments e
      JOIN public.academy_courses c ON c.id = e.course_id
      WHERE e.course_id = academy_modules.course_id
        AND e.student_id = (SELECT auth.uid())
        AND e.status IN ('active', 'completed')
        AND c.status IN ('published', 'archived')
    )
  );
CREATE POLICY academy_modules_admin_all
  ON public.academy_modules FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_lessons_enrolled_read
  ON public.academy_lessons FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (
      status = 'published'
      AND EXISTS (
        SELECT 1
        FROM public.academy_modules m
        JOIN public.academy_enrollments e ON e.course_id = m.course_id
        JOIN public.academy_courses c ON c.id = e.course_id
        WHERE m.id = academy_lessons.module_id
          AND e.student_id = (SELECT auth.uid())
          AND e.status IN ('active', 'completed')
          AND c.status IN ('published', 'archived')
      )
    )
  );
CREATE POLICY academy_lessons_admin_all
  ON public.academy_lessons FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_enrollments_own_read
  ON public.academy_enrollments FOR SELECT TO authenticated
  USING (student_id = (SELECT auth.uid()));
CREATE POLICY academy_enrollments_admin_all
  ON public.academy_enrollments FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_lesson_progress_own_read
  ON public.academy_lesson_progress FOR SELECT TO authenticated
  USING (student_id = (SELECT auth.uid()));
CREATE POLICY academy_lesson_progress_own_insert
  ON public.academy_lesson_progress FOR INSERT TO authenticated
  WITH CHECK (
    student_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.academy_lessons l
      JOIN public.academy_modules m ON m.id = l.module_id
      JOIN public.academy_enrollments e ON e.course_id = m.course_id
      WHERE l.id = academy_lesson_progress.lesson_id
        AND e.student_id = (SELECT auth.uid())
        AND e.status = 'active'
    )
  );
CREATE POLICY academy_lesson_progress_own_update
  ON public.academy_lesson_progress FOR UPDATE TO authenticated
  USING (student_id = (SELECT auth.uid()))
  WITH CHECK (
    student_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.academy_lessons l
      JOIN public.academy_modules m ON m.id = l.module_id
      JOIN public.academy_enrollments e ON e.course_id = m.course_id
      WHERE l.id = academy_lesson_progress.lesson_id
        AND e.student_id = (SELECT auth.uid())
        AND e.status = 'active'
    )
  );
CREATE POLICY academy_lesson_progress_admin_all
  ON public.academy_lesson_progress FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_assessments_enrolled_read
  ON public.academy_assessments FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (
      is_published
      AND EXISTS (
        SELECT 1
        FROM public.academy_lessons l
        JOIN public.academy_modules m ON m.id = l.module_id
        JOIN public.academy_enrollments e ON e.course_id = m.course_id
        WHERE l.id = academy_assessments.lesson_id
          AND e.student_id = (SELECT auth.uid())
          AND e.status = 'active'
      )
    )
  );
CREATE POLICY academy_assessments_admin_all
  ON public.academy_assessments FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_questions_enrolled_read
  ON public.academy_questions FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_assessments a
      JOIN public.academy_lessons l ON l.id = a.lesson_id
      JOIN public.academy_modules m ON m.id = l.module_id
      JOIN public.academy_enrollments e ON e.course_id = m.course_id
      WHERE a.id = academy_questions.assessment_id
        AND a.is_published
        AND e.student_id = (SELECT auth.uid())
        AND e.status = 'active'
    )
  );
CREATE POLICY academy_questions_admin_all
  ON public.academy_questions FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Answer keys are administrator-only; there is no student-facing SELECT policy.
CREATE POLICY academy_answer_keys_admin_all
  ON public.academy_question_answer_keys FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_attempts_own_read
  ON public.academy_attempts FOR SELECT TO authenticated
  USING (student_id = (SELECT auth.uid()));
CREATE POLICY academy_attempts_own_insert
  ON public.academy_attempts FOR INSERT TO authenticated
  WITH CHECK (
    student_id = (SELECT auth.uid())
    AND status = 'in_progress'
    AND EXISTS (
      SELECT 1
      FROM public.academy_assessments a
      JOIN public.academy_lessons l ON l.id = a.lesson_id
      JOIN public.academy_modules m ON m.id = l.module_id
      JOIN public.academy_enrollments e ON e.course_id = m.course_id
      WHERE a.id = academy_attempts.assessment_id
        AND a.is_published
        AND e.student_id = (SELECT auth.uid())
        AND e.status = 'active'
    )
  );
CREATE POLICY academy_attempts_own_update
  ON public.academy_attempts FOR UPDATE TO authenticated
  USING (student_id = (SELECT auth.uid()) AND status = 'in_progress')
  WITH CHECK (student_id = (SELECT auth.uid()) AND status IN ('in_progress', 'submitted'));
CREATE POLICY academy_attempts_admin_all
  ON public.academy_attempts FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_attempt_answers_own_read
  ON public.academy_attempt_answers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_attempts a
      WHERE a.id = academy_attempt_answers.attempt_id
        AND a.student_id = (SELECT auth.uid())
    )
  );
CREATE POLICY academy_attempt_answers_own_insert
  ON public.academy_attempt_answers FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.academy_attempts a
      WHERE a.id = academy_attempt_answers.attempt_id
        AND a.student_id = (SELECT auth.uid())
        AND a.status = 'in_progress'
    )
  );
CREATE POLICY academy_attempt_answers_own_update
  ON public.academy_attempt_answers FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_attempts a
      WHERE a.id = academy_attempt_answers.attempt_id
        AND a.student_id = (SELECT auth.uid())
        AND a.status = 'in_progress'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.academy_attempts a
      WHERE a.id = academy_attempt_answers.attempt_id
        AND a.student_id = (SELECT auth.uid())
        AND a.status = 'in_progress'
    )
  );
CREATE POLICY academy_attempt_answers_admin_all
  ON public.academy_attempt_answers FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_attempt_results_own_read
  ON public.academy_attempt_results FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_attempts a
      WHERE a.id = academy_attempt_results.attempt_id
        AND a.student_id = (SELECT auth.uid())
    )
  );
CREATE POLICY academy_attempt_results_admin_all
  ON public.academy_attempt_results FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- No client role can execute the private trigger function directly.
REVOKE ALL ON FUNCTION academy_private.set_updated_at() FROM PUBLIC, anon, authenticated;

COMMENT ON SCHEMA academy_private IS 'Private implementation helpers for My Academy; not exposed through the Supabase Data API.';
COMMENT ON TABLE public.academy_courses IS 'Standalone LMS course catalogue; independent from CMS pages.';
COMMENT ON TABLE public.academy_lessons IS 'Versioned structured lesson body. Keep large files in a private Storage bucket.';
COMMENT ON TABLE public.academy_question_answer_keys IS 'Private answer keys; never expose to learners.';
COMMENT ON TABLE public.academy_attempt_results IS 'Trusted grading output; clients cannot insert or update results.';
),
  CONSTRAINT academy_courses_title_not_blank CHECK (length(btrim(title)) > 0)
);

CREATE UNIQUE INDEX academy_courses_slug_lower_uidx
  ON public.academy_courses (lower(slug));
CREATE INDEX academy_courses_status_created_idx
  ON public.academy_courses (status, created_at DESC);
CREATE INDEX academy_courses_created_by_idx
  ON public.academy_courses (created_by);

CREATE TABLE public.academy_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  position integer NOT NULL CHECK (position > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_modules_course_position_key UNIQUE (course_id, position),
  CONSTRAINT academy_modules_title_not_blank CHECK (length(btrim(title)) > 0)
);

CREATE TABLE public.academy_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.academy_modules(id) ON DELETE RESTRICT,
  title text NOT NULL,
  summary text,
  position integer NOT NULL CHECK (position > 0),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  content jsonb NOT NULL DEFAULT '{"schema_version":1,"blocks":[]}'::jsonb,
  duration_minutes integer CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_lessons_module_position_key UNIQUE (module_id, position),
  CONSTRAINT academy_lessons_title_not_blank CHECK (length(btrim(title)) > 0),
  CONSTRAINT academy_lessons_content_object CHECK (jsonb_typeof(content) = 'object'),
  CONSTRAINT academy_lessons_content_schema_version CHECK (
    content ? 'schema_version'
    AND jsonb_typeof(content->'schema_version') = 'number'
    AND (content->>'schema_version')::integer >= 1
  )
);

-- Enrollment is the source of student access; no CMS role or self-enrollment.
CREATE TABLE public.academy_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE RESTRICT,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'revoked')),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_enrollments_course_student_key UNIQUE (course_id, student_id),
  CONSTRAINT academy_enrollments_completion_consistency CHECK (
    (status = 'completed' AND completed_at IS NOT NULL)
    OR (status <> 'completed' AND completed_at IS NULL)
  )
);
CREATE INDEX academy_enrollments_student_status_idx
  ON public.academy_enrollments (student_id, status);
-- The unique constraint already indexes course_id as its leading column.

CREATE TABLE public.academy_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.academy_lessons(id) ON DELETE RESTRICT,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed')),
  progress_percent numeric(5,2) NOT NULL DEFAULT 0
    CHECK (progress_percent >= 0 AND progress_percent <= 100),
  last_position_seconds integer NOT NULL DEFAULT 0 CHECK (last_position_seconds >= 0),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_lesson_progress_student_lesson_key UNIQUE (student_id, lesson_id),
  CONSTRAINT academy_lesson_progress_completion_consistency CHECK (
    (status = 'completed' AND completed_at IS NOT NULL AND progress_percent = 100)
    OR (status = 'in_progress' AND completed_at IS NULL)
  )
);
CREATE INDEX academy_lesson_progress_lesson_idx
  ON public.academy_lesson_progress (lesson_id);

-- Assessments. Correct answers are deliberately stored separately.
CREATE TABLE public.academy_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.academy_lessons(id) ON DELETE RESTRICT,
  title text NOT NULL,
  description text,
  pass_score numeric(5,2) NOT NULL DEFAULT 70
    CHECK (pass_score >= 0 AND pass_score <= 100),
  max_attempts integer CHECK (max_attempts IS NULL OR max_attempts > 0),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_assessments_title_not_blank CHECK (length(btrim(title)) > 0)
);
CREATE INDEX academy_assessments_lesson_idx
  ON public.academy_assessments (lesson_id);

CREATE TABLE public.academy_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.academy_assessments(id) ON DELETE RESTRICT,
  question_type text NOT NULL
    CHECK (question_type IN ('single_choice', 'multiple_choice', 'short_text', 'long_text')),
  prompt text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  points numeric(8,2) NOT NULL DEFAULT 1 CHECK (points > 0),
  position integer NOT NULL CHECK (position > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_questions_assessment_position_key UNIQUE (assessment_id, position),
  CONSTRAINT academy_questions_options_array CHECK (jsonb_typeof(options) = 'array'),
  CONSTRAINT academy_questions_prompt_not_blank CHECK (length(btrim(prompt)) > 0)
);

CREATE TABLE public.academy_question_answer_keys (
  question_id uuid PRIMARY KEY REFERENCES public.academy_questions(id) ON DELETE RESTRICT,
  correct_answer jsonb NOT NULL,
  explanation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.academy_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.academy_assessments(id) ON DELETE RESTRICT,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL CHECK (attempt_number > 0),
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'submitted', 'graded')),
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_attempts_assessment_student_number_key
    UNIQUE (assessment_id, student_id, attempt_number),
  CONSTRAINT academy_attempts_submission_consistency CHECK (
    (status = 'in_progress' AND submitted_at IS NULL)
    OR (status IN ('submitted', 'graded') AND submitted_at IS NOT NULL)
  )
);
CREATE INDEX academy_attempts_student_idx
  ON public.academy_attempts (student_id, started_at DESC);

CREATE TABLE public.academy_attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.academy_attempts(id) ON DELETE RESTRICT,
  question_id uuid NOT NULL REFERENCES public.academy_questions(id) ON DELETE RESTRICT,
  answer jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_attempt_answers_attempt_question_key UNIQUE (attempt_id, question_id)
);
CREATE INDEX academy_attempt_answers_question_idx
  ON public.academy_attempt_answers (question_id);

-- Results are written only by the trusted grading path or an admin.
CREATE TABLE public.academy_attempt_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL UNIQUE REFERENCES public.academy_attempts(id) ON DELETE RESTRICT,
  score_percent numeric(5,2) NOT NULL CHECK (score_percent >= 0 AND score_percent <= 100),
  passed boolean NOT NULL,
  feedback text,
  graded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  graded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX academy_attempt_results_graded_by_idx
  ON public.academy_attempt_results (graded_by);

-- Consistent updated_at behavior without exposing a callable public RPC.
CREATE TRIGGER academy_courses_set_updated_at
  BEFORE UPDATE ON public.academy_courses
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_modules_set_updated_at
  BEFORE UPDATE ON public.academy_modules
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_lessons_set_updated_at
  BEFORE UPDATE ON public.academy_lessons
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_enrollments_set_updated_at
  BEFORE UPDATE ON public.academy_enrollments
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_lesson_progress_set_updated_at
  BEFORE UPDATE ON public.academy_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_assessments_set_updated_at
  BEFORE UPDATE ON public.academy_assessments
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_questions_set_updated_at
  BEFORE UPDATE ON public.academy_questions
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_question_answer_keys_set_updated_at
  BEFORE UPDATE ON public.academy_question_answer_keys
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_attempts_set_updated_at
  BEFORE UPDATE ON public.academy_attempts
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();
CREATE TRIGGER academy_attempt_answers_set_updated_at
  BEFORE UPDATE ON public.academy_attempt_answers
  FOR EACH ROW EXECUTE FUNCTION academy_private.set_updated_at();

-- RLS is enabled on every exposed Academy table.
ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_question_answer_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_attempt_results ENABLE ROW LEVEL SECURITY;

-- Remove any default client privileges before granting the smallest required set.
REVOKE ALL ON TABLE
  public.academy_courses,
  public.academy_modules,
  public.academy_lessons,
  public.academy_enrollments,
  public.academy_lesson_progress,
  public.academy_assessments,
  public.academy_questions,
  public.academy_question_answer_keys,
  public.academy_attempts,
  public.academy_attempt_answers,
  public.academy_attempt_results
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.academy_courses TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.academy_courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.academy_modules,
  public.academy_lessons,
  public.academy_enrollments,
  public.academy_assessments,
  public.academy_questions,
  public.academy_question_answer_keys,
  public.academy_attempts,
  public.academy_attempt_answers
TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.academy_lesson_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_attempt_results TO authenticated;
GRANT ALL ON TABLE
  public.academy_courses,
  public.academy_modules,
  public.academy_lessons,
  public.academy_enrollments,
  public.academy_lesson_progress,
  public.academy_assessments,
  public.academy_questions,
  public.academy_question_answer_keys,
  public.academy_attempts,
  public.academy_attempt_answers,
  public.academy_attempt_results
TO service_role;

-- Catalogue: only published courses are visible to the public.
CREATE POLICY academy_courses_catalog_read
  ON public.academy_courses FOR SELECT TO anon, authenticated
  USING (status = 'published');
CREATE POLICY academy_courses_admin_all
  ON public.academy_courses FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Course structure is visible only to enrolled learners or the admin.
CREATE POLICY academy_modules_enrolled_read
  ON public.academy_modules FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_enrollments e
      JOIN public.academy_courses c ON c.id = e.course_id
      WHERE e.course_id = academy_modules.course_id
        AND e.student_id = (SELECT auth.uid())
        AND e.status IN ('active', 'completed')
        AND c.status IN ('published', 'archived')
    )
  );
CREATE POLICY academy_modules_admin_all
  ON public.academy_modules FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_lessons_enrolled_read
  ON public.academy_lessons FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (
      status = 'published'
      AND EXISTS (
        SELECT 1
        FROM public.academy_modules m
        JOIN public.academy_enrollments e ON e.course_id = m.course_id
        JOIN public.academy_courses c ON c.id = e.course_id
        WHERE m.id = academy_lessons.module_id
          AND e.student_id = (SELECT auth.uid())
          AND e.status IN ('active', 'completed')
          AND c.status IN ('published', 'archived')
      )
    )
  );
CREATE POLICY academy_lessons_admin_all
  ON public.academy_lessons FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_enrollments_own_read
  ON public.academy_enrollments FOR SELECT TO authenticated
  USING (student_id = (SELECT auth.uid()));
CREATE POLICY academy_enrollments_admin_all
  ON public.academy_enrollments FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_lesson_progress_own_read
  ON public.academy_lesson_progress FOR SELECT TO authenticated
  USING (student_id = (SELECT auth.uid()));
CREATE POLICY academy_lesson_progress_own_insert
  ON public.academy_lesson_progress FOR INSERT TO authenticated
  WITH CHECK (
    student_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.academy_lessons l
      JOIN public.academy_modules m ON m.id = l.module_id
      JOIN public.academy_enrollments e ON e.course_id = m.course_id
      WHERE l.id = academy_lesson_progress.lesson_id
        AND e.student_id = (SELECT auth.uid())
        AND e.status = 'active'
    )
  );
CREATE POLICY academy_lesson_progress_own_update
  ON public.academy_lesson_progress FOR UPDATE TO authenticated
  USING (student_id = (SELECT auth.uid()))
  WITH CHECK (
    student_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.academy_lessons l
      JOIN public.academy_modules m ON m.id = l.module_id
      JOIN public.academy_enrollments e ON e.course_id = m.course_id
      WHERE l.id = academy_lesson_progress.lesson_id
        AND e.student_id = (SELECT auth.uid())
        AND e.status = 'active'
    )
  );
CREATE POLICY academy_lesson_progress_admin_all
  ON public.academy_lesson_progress FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_assessments_enrolled_read
  ON public.academy_assessments FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (
      is_published
      AND EXISTS (
        SELECT 1
        FROM public.academy_lessons l
        JOIN public.academy_modules m ON m.id = l.module_id
        JOIN public.academy_enrollments e ON e.course_id = m.course_id
        WHERE l.id = academy_assessments.lesson_id
          AND e.student_id = (SELECT auth.uid())
          AND e.status = 'active'
      )
    )
  );
CREATE POLICY academy_assessments_admin_all
  ON public.academy_assessments FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_questions_enrolled_read
  ON public.academy_questions FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_assessments a
      JOIN public.academy_lessons l ON l.id = a.lesson_id
      JOIN public.academy_modules m ON m.id = l.module_id
      JOIN public.academy_enrollments e ON e.course_id = m.course_id
      WHERE a.id = academy_questions.assessment_id
        AND a.is_published
        AND e.student_id = (SELECT auth.uid())
        AND e.status = 'active'
    )
  );
CREATE POLICY academy_questions_admin_all
  ON public.academy_questions FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Answer keys are administrator-only; there is no student-facing SELECT policy.
CREATE POLICY academy_answer_keys_admin_all
  ON public.academy_question_answer_keys FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_attempts_own_read
  ON public.academy_attempts FOR SELECT TO authenticated
  USING (student_id = (SELECT auth.uid()));
CREATE POLICY academy_attempts_own_insert
  ON public.academy_attempts FOR INSERT TO authenticated
  WITH CHECK (
    student_id = (SELECT auth.uid())
    AND status = 'in_progress'
    AND EXISTS (
      SELECT 1
      FROM public.academy_assessments a
      JOIN public.academy_lessons l ON l.id = a.lesson_id
      JOIN public.academy_modules m ON m.id = l.module_id
      JOIN public.academy_enrollments e ON e.course_id = m.course_id
      WHERE a.id = academy_attempts.assessment_id
        AND a.is_published
        AND e.student_id = (SELECT auth.uid())
        AND e.status = 'active'
    )
  );
CREATE POLICY academy_attempts_own_update
  ON public.academy_attempts FOR UPDATE TO authenticated
  USING (student_id = (SELECT auth.uid()) AND status = 'in_progress')
  WITH CHECK (student_id = (SELECT auth.uid()) AND status IN ('in_progress', 'submitted'));
CREATE POLICY academy_attempts_admin_all
  ON public.academy_attempts FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_attempt_answers_own_read
  ON public.academy_attempt_answers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_attempts a
      WHERE a.id = academy_attempt_answers.attempt_id
        AND a.student_id = (SELECT auth.uid())
    )
  );
CREATE POLICY academy_attempt_answers_own_insert
  ON public.academy_attempt_answers FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.academy_attempts a
      WHERE a.id = academy_attempt_answers.attempt_id
        AND a.student_id = (SELECT auth.uid())
        AND a.status = 'in_progress'
    )
  );
CREATE POLICY academy_attempt_answers_own_update
  ON public.academy_attempt_answers FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_attempts a
      WHERE a.id = academy_attempt_answers.attempt_id
        AND a.student_id = (SELECT auth.uid())
        AND a.status = 'in_progress'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.academy_attempts a
      WHERE a.id = academy_attempt_answers.attempt_id
        AND a.student_id = (SELECT auth.uid())
        AND a.status = 'in_progress'
    )
  );
CREATE POLICY academy_attempt_answers_admin_all
  ON public.academy_attempt_answers FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY academy_attempt_results_own_read
  ON public.academy_attempt_results FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_attempts a
      WHERE a.id = academy_attempt_results.attempt_id
        AND a.student_id = (SELECT auth.uid())
    )
  );
CREATE POLICY academy_attempt_results_admin_all
  ON public.academy_attempt_results FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- No client role can execute the private trigger function directly.
REVOKE ALL ON FUNCTION academy_private.set_updated_at() FROM PUBLIC, anon, authenticated;

COMMENT ON SCHEMA academy_private IS 'Private implementation helpers for My Academy; not exposed through the Supabase Data API.';
COMMENT ON TABLE public.academy_courses IS 'Standalone LMS course catalogue; independent from CMS pages.';
COMMENT ON TABLE public.academy_lessons IS 'Versioned structured lesson body. Keep large files in a private Storage bucket.';
COMMENT ON TABLE public.academy_question_answer_keys IS 'Private answer keys; never expose to learners.';
COMMENT ON TABLE public.academy_attempt_results IS 'Trusted grading output; clients cannot insert or update results.';
