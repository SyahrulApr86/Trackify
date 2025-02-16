/*
  # Add archive support columns

  1. Changes
    - Add archived_at and completed_at columns to tasks table
    - Add trigger to automatically set completed_at when status changes to 'Done'
    - Update existing functions to handle the new columns

  2. Notes
    - completed_at is set automatically when a task is marked as Done
    - archived_at is set either manually or by the archiving function
*/

-- Add new columns to tasks table
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- Create function to handle task completion
CREATE OR REPLACE FUNCTION handle_task_completion()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'Done' AND OLD.status != 'Done' THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status != 'Done' AND OLD.status = 'Done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task completion
DROP TRIGGER IF EXISTS task_completion_trigger ON tasks;
CREATE TRIGGER task_completion_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION handle_task_completion();

-- Update the check_and_archive_tasks function to use completed_at
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

-- Update the archive_task function to handle completed_at
CREATE OR REPLACE FUNCTION archive_task(task_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE tasks
  SET 
    archived_at = NOW(),
    completed_at = COALESCE(completed_at, NOW())
  WHERE id = task_id
    AND archived_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Update the unarchive_task function
CREATE OR REPLACE FUNCTION unarchive_task(task_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE tasks
  SET archived_at = NULL
  WHERE id = task_id;
END;
$$ LANGUAGE plpgsql;