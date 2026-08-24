-- Due mode (deadline vs execution day) + completion timestamps for history.

DO $$ BEGIN
  CREATE TYPE public.due_mode AS ENUM ('DEADLINE', 'EXECUTION');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS due_mode public.due_mode NOT NULL DEFAULT 'DEADLINE',
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE public.task_templates
  ADD COLUMN IF NOT EXISTS due_mode public.due_mode NOT NULL DEFAULT 'DEADLINE';

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS due_mode public.due_mode NOT NULL DEFAULT 'DEADLINE',
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

COMMENT ON COLUMN public.tasks.due_mode IS 'DEADLINE = last moment to finish; EXECUTION = scheduled day to do it';
COMMENT ON COLUMN public.tasks.completed_at IS 'When the task reached a terminal completed state';
COMMENT ON COLUMN public.expenses.completed_at IS 'When the expense was settled';

-- Backfill completion times from updated_at for already-closed rows.
UPDATE public.tasks
SET completed_at = updated_at
WHERE completed_at IS NULL
  AND status IN ('COMPLETED', 'RESOLVED_LATE', 'RESOLVED_BY_PEER', 'SKIPPED');

UPDATE public.expenses
SET completed_at = updated_at
WHERE completed_at IS NULL
  AND status IN ('SETTLED', 'ARCHIVED');
