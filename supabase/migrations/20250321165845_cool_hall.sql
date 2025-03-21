/*
  # Add Archive Support

  1. Changes
    - Add archived_at and completed_at columns to tasks table
    - Add trigger to automatically set completed_at when status changes to 'Done'
    - Add function to check and archive tasks completed > 7 days ago
    - Add functions for manual archive/unarchive

  2. Security
    - Maintain existing RLS policies
    - Functions use security definer to ensure proper access
*/

-- Add archive-related columns
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

-- Create function to check and archive tasks
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

-- Create trigger to check for tasks to archive
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to unarchive a task
CREATE OR REPLACE FUNCTION unarchive_task(task_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE tasks
  SET archived_at = NULL
  WHERE id = task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;