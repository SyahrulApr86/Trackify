/*
  # Optimize task functions

  1. Changes
    - Optimize task completion and archiving functions to prevent stack overflow
    - Add safeguards against recursive trigger calls
    - Improve function performance

  2. Notes
    - Functions are rewritten to be more efficient
    - Added checks to prevent trigger recursion
    - Simplified logic to reduce stack usage
*/

-- Optimize the task completion handler
CREATE OR REPLACE FUNCTION handle_task_completion()
RETURNS trigger AS $$
BEGIN
  -- Only proceed if there's an actual status change
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'Done' THEN
      NEW.completed_at = NOW();
    ELSE
      NEW.completed_at = NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optimize the archive checker
CREATE OR REPLACE FUNCTION check_and_archive_tasks()
RETURNS trigger AS $$
DECLARE
  archive_threshold timestamptz;
BEGIN
  -- Calculate the threshold once
  archive_threshold := NOW() - INTERVAL '7 days';
  
  -- Use a direct update with simplified conditions
  UPDATE tasks
  SET archived_at = NOW()
  WHERE status = 'Done'
    AND completed_at < archive_threshold
    AND archived_at IS NULL
    AND id != COALESCE(TG_ARGV[0]::uuid, '00000000-0000-0000-0000-000000000000'::uuid);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Optimize the manual archive function
CREATE OR REPLACE FUNCTION archive_task(task_id uuid)
RETURNS void AS $$
BEGIN
  -- Use a single atomic update
  UPDATE tasks
  SET 
    archived_at = NOW(),
    completed_at = COALESCE(completed_at, NOW())
  WHERE id = task_id
    AND archived_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Optimize the unarchive function
CREATE OR REPLACE FUNCTION unarchive_task(task_id uuid)
RETURNS void AS $$
BEGIN
  -- Simple direct update
  UPDATE tasks
  SET archived_at = NULL
  WHERE id = task_id;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers with optimizations
DROP TRIGGER IF EXISTS task_completion_trigger ON tasks;
CREATE TRIGGER task_completion_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION handle_task_completion();

DROP TRIGGER IF EXISTS check_archive_trigger ON tasks;
CREATE TRIGGER check_archive_trigger
  AFTER UPDATE OF status, completed_at ON tasks
  FOR EACH STATEMENT
  EXECUTE FUNCTION check_and_archive_tasks();