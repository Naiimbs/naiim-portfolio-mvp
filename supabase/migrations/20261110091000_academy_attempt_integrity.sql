-- My Academy assessment integrity hardening.
-- Enforces attempt limits and protects learner submissions at the database layer.
SET lock_timeout = '5s';

CREATE OR REPLACE FUNCTION academy_private.prepare_attempt()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  v_max_attempts integer;
  v_attempt_count integer;
  v_next_attempt_number integer;
BEGIN
  -- Admin operations are governed by the admin RLS policy.
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.student_id IS DISTINCT FROM (SELECT auth.uid()) THEN
      RAISE EXCEPTION 'An attempt can only be created for the signed-in learner'
        USING ERRCODE = '42501';
    END IF;

    -- Serialize attempt creation per learner and assessment to avoid race conditions.
    PERFORM pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(NEW.assessment_id::text || ':' || NEW.student_id::text, 0)
    );

    SELECT a.max_attempts
      INTO v_max_attempts
    FROM public.academy_assessments a
    WHERE a.id = NEW.assessment_id
      AND a.is_published = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Assessment is unavailable'
        USING ERRCODE = '23514';
    END IF;

    SELECT count(*)::integer, COALESCE(max(a.attempt_number), 0)::integer
      INTO v_attempt_count, v_next_attempt_number
    FROM public.academy_attempts a
    WHERE a.assessment_id = NEW.assessment_id
      AND a.student_id = NEW.student_id;

    IF v_max_attempts IS NOT NULL AND v_attempt_count >= v_max_attempts THEN
      RAISE EXCEPTION 'Maximum number of attempts reached'
        USING ERRCODE = '23514';
    END IF;

    -- Never trust client-supplied attempt numbers or initial status.
    NEW.attempt_number := v_next_attempt_number + 1;
    NEW.status := 'in_progress';
    NEW.submitted_at := NULL;
    RETURN NEW;
  END IF;

  -- Learners cannot move an attempt to another assessment or another account.
  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.assessment_id IS DISTINCT FROM OLD.assessment_id
    OR NEW.student_id IS DISTINCT FROM OLD.student_id
    OR NEW.attempt_number IS DISTINCT FROM OLD.attempt_number
    OR NEW.started_at IS DISTINCT FROM OLD.started_at THEN
    RAISE EXCEPTION 'Attempt identity fields cannot be changed'
      USING ERRCODE = '42501';
  END IF;

  IF OLD.status <> 'in_progress' OR NEW.status NOT IN ('in_progress', 'submitted') THEN
    RAISE EXCEPTION 'Only an in-progress attempt can be submitted'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.status = 'submitted' THEN
    NEW.submitted_at := pg_catalog.now();
  ELSE
    NEW.submitted_at := NULL;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION academy_private.validate_attempt_answer()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  v_assessment_id uuid;
  v_question_assessment_id uuid;
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND (
    NEW.id IS DISTINCT FROM OLD.id
    OR NEW.attempt_id IS DISTINCT FROM OLD.attempt_id
    OR NEW.question_id IS DISTINCT FROM OLD.question_id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  ) THEN
    RAISE EXCEPTION 'Answer identity fields cannot be changed'
      USING ERRCODE = '42501';
  END IF;

  SELECT a.assessment_id
    INTO v_assessment_id
  FROM public.academy_attempts a
  WHERE a.id = NEW.attempt_id
    AND a.student_id = (SELECT auth.uid())
    AND a.status = 'in_progress';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt is not editable'
      USING ERRCODE = '42501';
  END IF;

  SELECT q.assessment_id
    INTO v_question_assessment_id
  FROM public.academy_questions q
  WHERE q.id = NEW.question_id;

  IF NOT FOUND OR v_question_assessment_id IS DISTINCT FROM v_assessment_id THEN
    RAISE EXCEPTION 'Question does not belong to this assessment'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER academy_attempts_prepare_insert
  BEFORE INSERT ON public.academy_attempts
  FOR EACH ROW EXECUTE FUNCTION academy_private.prepare_attempt();

CREATE TRIGGER academy_attempts_protect_update
  BEFORE UPDATE ON public.academy_attempts
  FOR EACH ROW EXECUTE FUNCTION academy_private.prepare_attempt();

CREATE TRIGGER academy_attempt_answers_validate_insert
  BEFORE INSERT ON public.academy_attempt_answers
  FOR EACH ROW EXECUTE FUNCTION academy_private.validate_attempt_answer();

CREATE TRIGGER academy_attempt_answers_validate_update
  BEFORE UPDATE ON public.academy_attempt_answers
  FOR EACH ROW EXECUTE FUNCTION academy_private.validate_attempt_answer();

REVOKE ALL ON FUNCTION academy_private.prepare_attempt() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION academy_private.validate_attempt_answer() FROM PUBLIC, anon, authenticated;
