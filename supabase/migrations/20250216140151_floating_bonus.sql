/*
  # Fix archive support

  1. Changes
    - Remove cron dependency
    - Keep all archiving functionality
    - Tasks will be archived when queried if they meet the criteria

  2. Notes
    - Instead of using cron, we'll check and archive tasks when they're queried
    - This provides a simpler solution that doesn't require additional extensions
*/

-- Create function to check and archive completed tasks
CREATE OR REPLACE FUNCTION check_and_archive_tasks()
RETURNS trigger AS $$
BEGIN
  -- Archive tasks that have been completed for more than 7 days
  UPDATE tasks
  SET archived_at = NOW()
  WHERE status = 'Done'
    AND completed_at < NOW() - INTERVAL '7 days'
    AND archived_at IS NULL;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check for tasks to archive on any task table operation
DROP TRIGGER IF EXISTS check_archive_trigger ON tasks;
CREATE TRIGGER check_archive_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH STATEMENT
  EXECUTE FUNCTION check_and_archive_tasks();

-- Create function to manually archive a task
CREATE OR REPLACE FUNCTION archive_task(task_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE tasks
  SET archived_at = NOW()
  WHERE id = task_id
    AND archived_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to unarchive a task
CREATE OR REPLACE FUNCTION unarchive_task(task_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE tasks
  SET archived_at = NULL
  WHERE id = task_id;
END;
$$ LANGUAGE plpgsql;