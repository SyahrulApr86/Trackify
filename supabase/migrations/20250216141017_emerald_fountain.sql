/*
  # Update archive functionality

  1. Changes
    - Remove status check from archive_task function to allow archiving any task
    - Keep automatic archiving for completed tasks after 7 days
    - Update trigger to handle archiving of any task

  2. Security
    - Maintain existing RLS policies
    - No changes to access control
*/

-- Update the archive_task function to allow archiving any task
CREATE OR REPLACE FUNCTION archive_task(task_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE tasks
  SET 
    archived_at = NOW(),
    completed_at = CASE 
      WHEN status = 'Done' THEN COALESCE(completed_at, NOW())
      ELSE completed_at
    END
  WHERE id = task_id
    AND archived_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Keep the automatic archiving of completed tasks
CREATE OR REPLACE FUNCTION check_and_archive_tasks()
RETURNS trigger AS $$
DECLARE
  archive_threshold timestamptz;
BEGIN
  -- Calculate the threshold once
  archive_threshold := NOW() - INTERVAL '7 days';
  
  -- Only auto-archive tasks that are marked as Done
  UPDATE tasks
  SET archived_at = NOW()
  WHERE status = 'Done'
    AND completed_at < archive_threshold
    AND archived_at IS NULL
    AND id != COALESCE(TG_ARGV[0]::uuid, '00000000-0000-0000-0000-000000000000'::uuid);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;