-- Drop triggers first
DROP TRIGGER IF EXISTS check_archive_trigger ON tasks;
DROP TRIGGER IF EXISTS task_completion_trigger ON tasks;

-- Drop functions
DROP FUNCTION IF EXISTS check_and_archive_tasks();
DROP FUNCTION IF EXISTS handle_task_completion();
DROP FUNCTION IF EXISTS archive_task(uuid);
DROP FUNCTION IF EXISTS unarchive_task(uuid);